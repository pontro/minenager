import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.subscription import Subscription

# Initialize Stripe Client with exact version & beta flag required by Checkout Studio
stripe.api_key = settings.STRIPE_SECRET_KEY
stripe.api_version = "2026-03-25.dahlia; custom_checkout_payment_form_preview=v1"

router = APIRouter(prefix="/billing", tags=["billing"])

@router.get("/config")
async def get_billing_config():
    """Return Stripe publishable key to client for Dahlia form initialization."""
    return {
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY
    }

@router.post("/create-checkout-session")
async def create_checkout_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates an embedded Stripe Checkout Session with Field Intents specified by Checkout Studio.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe Secret Key is not configured on server.")

    mode = "subscription"

    session_params: Dict[str, Any] = {
        # fixed_by_ui: ui_mode "form" for Stripe SDK >= 21.0.0
        "ui_mode": "form",
        "mode": mode,
        "billing_address_collection": "auto",
        "phone_number_collection": {"enabled": False},
        "automatic_tax": {"enabled": False},
        "submit_type": "auto",
        "integration_identifier": "custom_embedded_web_0001",
        # sample_only: actual Stripe Price ID for Minenager Pro
        "line_items": [
            {
                "price": settings.STRIPE_PRICE_ID,
                "quantity": 1
            }
        ],
        "customer_email": current_user.email,
        "client_reference_id": str(current_user.id),
        "metadata": {
            "user_id": str(current_user.id),
            "username": current_user.username
        }
    }

    if mode == "subscription":
        session_params["payment_method_collection"] = "always"

    try:
        session = stripe.checkout.Session.create(**session_params)
        return {"client_secret": session.client_secret}
    except Exception as e:
        print(f"[Minenager Stripe] Checkout session error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Handles Stripe webhooks (e.g. checkout.session.completed) to fulfill purchase and upgrade user.
    """
    payload = await request.body()
    event = None

    if settings.STRIPE_WEBHOOK_SECRET and stripe_signature:
        try:
            event = stripe.Webhook.construct_event(
                payload=payload,
                sig_header=stripe_signature,
                secret=settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception as e:
            print(f"[Minenager Stripe Webhook] Signature verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    elif settings.ENVIRONMENT.lower() == "production":
        # In production, webhook signature is strictly required
        raise HTTPException(
            status_code=400,
            detail="Stripe webhook signature and STRIPE_WEBHOOK_SECRET are strictly required in production."
        )
    else:
        # In local development without webhook secret, parse raw payload
        import json
        try:
            event = json.loads(payload.decode("utf-8"))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid payload")

    event_type = event.get("type") if isinstance(event, dict) else event.type
    event_data = event.get("data", {}).get("object", {}) if isinstance(event, dict) else event.data.object

    if event_type == "checkout.session.completed":
        session_obj = event_data
        user_id = session_obj.get("client_reference_id") or session_obj.get("metadata", {}).get("user_id")
        customer_id = session_obj.get("customer")
        subscription_id = session_obj.get("subscription")

        print(f"[Minenager Stripe Webhook] Checkout completed for user {user_id}: session={session_obj.get('id')}")

        if user_id:
            try:
                import uuid
                uid = uuid.UUID(str(user_id))
                stmt = select(User).where(User.id == uid)
                res = await db.execute(stmt)
                user = res.scalars().first()
                if user:
                    user.tier = "pro"
                    # Record or update Subscription model
                    sub_stmt = select(Subscription).where(Subscription.user_id == uid)
                    sub_res = await db.execute(sub_stmt)
                    sub = sub_res.scalars().first()
                    if not sub:
                        sub = Subscription(
                            user_id=uid,
                            stripe_customer_id=customer_id,
                            stripe_subscription_id=subscription_id,
                            status="active",
                            plan_type="monthly"
                        )
                        db.add(sub)
                    else:
                        sub.stripe_customer_id = customer_id
                        sub.stripe_subscription_id = subscription_id
                        sub.status = "active"

                    await db.commit()
                    print(f"[Minenager Stripe Webhook] Successfully upgraded user {user.username} to PRO!")
            except Exception as e:
                print(f"[Minenager Stripe Webhook] Failed to update user tier: {e}")

    return {"status": "success"}
