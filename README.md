# Home World Frontend

Build a complete responsive e-commerce frontend for Home World, a local home-appliance store in Dhayari, Pune.

IMPORTANT:

The Supabase database already exists and is already configured.

DO NOT create, modify, recreate, migrate, or seed database tables.

DO NOT generate a new backend.

Use the existing Supabase database/tables and existing data.

Focus primarily on frontend UI, pages, components, navigation and connecting existing data.

Keep implementation simple and token-efficient.

Do not add unnecessary features, animations, libraries, abstractions or explanations.

Prioritize a working app over visual complexity.

EXISTING DATABASE TABLES:
categories
products
product_images
customers
orders
order_items
reviews
inventory_transactions

CUSTOMER WEBSITE:

HOME

Home World branding

Hero/banner

Product categories

Featured products

Popular products

Search

Store/contact section

SHOP

Product grid

Search

Category filter

Price sorting

Rating sorting

Product cards showing image, name, brand, price, discount and stock status.

PRODUCT PAGE

Product images

Name, brand and price

Discount

Description

Specifications

Warranty

Stock status

Quantity selector

Add to cart

Buy now

Average rating

Customer reviews

Review submission form

CART

Products and quantities

Increase/decrease quantity

Remove item

Subtotal

Discount

Total

Checkout

CHECKOUT
Collect:

Name

Phone

Email

Address

City

Pincode

Order notes

Payment method: COD or UPI

Create the order using the EXISTING orders and order_items tables.

ORDER CONFIRMATION

Order ID

Ordered products

Total

Payment method

Order status

ADMIN DASHBOARD
Create a clean protected admin interface.

Dashboard:

Total products

Pending orders

Sales

Low-stock products

Recent orders

Products:

View products

Add product

Edit product

Change price

Change discount

Adjust stock

Upload/edit images

Activate/deactivate products

Orders:

View orders

View order details

Accept/reject orders

Change status

Rejection reason

Customer information

Reviews:

View reviews

Hide/show reviews

Inventory:

Show current stock

Show inventory transaction history

Allow stock adjustments

DESIGN:

Modern, clean appliance-store aesthetic.

Professional local-business feel.

Mobile-first and fully responsive.

Simple navigation.

Clear prices and CTAs.

Use reusable React components.

Include loading, empty and error states.

Avoid excessive animations.

TECHNICAL:

React + TypeScript

Tailwind CSS

Use the existing Supabase connection.

Use existing table/column names exactly.

Never invent a second database.

Keep code modular but simple.

Do not implement payment gateway integration.

Do not implement complex accounting yet.

Do not add unnecessary dependencies.

FIRST PRIORITY:
Make the customer storefront, product browsing, product details, cart and checkout fully functional.

SECOND PRIORITY:
Make the admin dashboard functional using the existing tables.

If a feature cannot safely be implemented with the existing schema, leave it as a simple UI placeholder rather than changing the database.

DO NOT spend tokens explaining what you are doing. Build the application.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://home-world-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dffcca4b-56ef-413c-82ab-492897c9dc3a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
