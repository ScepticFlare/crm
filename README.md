# Compact CRM

Compact CRM is a full-stack customer relationship management application developed for Compact Systems to manage leads, opportunities, customers, follow-ups, employees, and related business operations from a centralized web application.

The frontend is built with React and communicates with a separate Java/Spring Boot REST API.

The application is deployed and actively used internally by 10+ employees.

## Overview

The CRM provides a centralized interface for managing the complete customer lifecycle:

Lead → Opportunity → Customer

It also provides employee management, follow-ups, activity history, reporting, file handling, and email-related workflows.

## Features

### Lead Management

- Create, update, and manage leads
- Track lead status and lifecycle
- Search, filter, sort, and paginate lead records
- Manage lead products and related information
- Convert qualified leads into opportunities
- Track lead activity and history

### Opportunity Management

- Manage opportunities and their stages
- Track opportunity details and related products
- Manage opportunity follow-ups
- Apply business rules to opportunity transitions
- Convert completed opportunities into customers

### Customer Management

- Manage customer records
- View customer-related information and history
- Maintain relationships between customers and opportunities

### Follow-ups

- Create and manage follow-up activities
- Track follow-up status and dates
- View follow-up information within relevant CRM records

### Employee Management

- Manage employees and their roles
- Support Admin, Manager, and Employee access levels
- Apply role and scope-based access throughout the application

### Activity & History

- Track important actions performed within the CRM
- View activity history for relevant records
- Maintain visibility into changes made by users

### Reporting

- View CRM reports and business information
- Filter and retrieve relevant data
- Export supported CRM data

### Additional Functionality

- File upload and management
- Email-related workflows
- Import and export functionality
- Pagination, filtering, and search across CRM data

## Authentication & Access Control

The frontend works with the backend's authentication and authorization system.

Users authenticate through the login system and authenticated API requests use Bearer tokens.

Access to CRM functionality is determined by the user's role and permissions provided by the backend.

The main roles are:

- Admin
- Manager
- Employee

The backend also applies scope-based access rules where appropriate.

## Tech Stack

### Frontend

- React
- JavaScript
- React Router
- Axios
- Bootstrap
- HTML
- CSS

### Backend

- Java
- Spring Boot
- Spring Security
- JPA / Hibernate
- PostgreSQL
- REST APIs

### External Services & Deployment

- Supabase Storage
- Brevo API
- Docker
- Render

## Frontend Structure

The frontend is organized into reusable pages, components, services, hooks, and utilities.

```text
src/
├── components/
│   ├── common/
│   ├── detail/
│   └── ...
├── pages/
├── services/
├── hooks/
├── utils/
└── ...
