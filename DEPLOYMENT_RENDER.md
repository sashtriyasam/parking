# 🚀 Deploying ParkEasy to Render.com

This guide explains how to deploy the full-stack ParkEasy application using the provided `render.yaml` Blueprint.

## 1. Prerequisites

- A [Render.com](https://render.com) account.
- A [Supabase](https://supabase.com) project (you already have `parkeasy-prod`).
- Your code pushed to a GitHub or GitLab repository.

## 2. Supabase Connection Strings

You will need the following from your Supabase Dashboard (**Settings > Database**):

1. **DATABASE_URL**: Use the **Transaction Pooler** string (ending in `:6543/postgres?pgbouncer=true`).
2. **DIRECT_URL**: Use the **Session/Direct** connection string (ending in `:5432/postgres`).

> [!IMPORTANT]
> Ensure you use the correct password for your `postgres` user. If you've forgotten it, you can reset it in the Supabase Database settings.

## 3. One-Click Deployment Steps

1. Log in to **Render Dashboard**.
2. Click **New +** > **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect the `render.yaml` file and show two services: `parkeasy-backend` and `parkeasy-frontend`.
5. Enter the following Environment Variables when prompted:
   - **DATABASE_URL**: (Paste your Supabase Pooler URL)
   - **DIRECT_URL**: (Paste your Supabase Direct URL)
   - **GOOGLE_MAPS_API_KEY**: (Your API Key)
   - **FRONTEND_URL**: (Leave blank for now, or use `https://parkeasy-frontend.onrender.com` once created)
6. Click **Apply**.

## 4. Finalizing the Connection

Once the backend is successfully deployed:
1. Copy the **Backend URL** (e.g., `https://parkeasy-backend.onrender.com`).
2. Go to the **parkeasy-frontend** service settings in Render.
3. Update the **VITE_API_URL** environment variable with the Backend URL (append `/api/v1` to the end, e.g., `https://parkeasy-backend.onrender.com/api/v1`).
4. Trigger a new manual deploy for the frontend to bake in the new URL.

## 5. Troubleshooting Sockets

Render supports WebSockets natively on the `web` service type. If you experience connection issues:
- Ensure the `FRONTEND_URL` in the backend service matches your frontend's actual URL (for CORS).
- Check the backend logs for "Socket.io initialized".
