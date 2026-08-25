# Compact CRM

Compact CRM is a full-stack customer relationship management application developed for Compact Systems to manage leads, opportunities, customers, follow-ups, employees, reporting, and related business operations through a centralized web application.

This repository contains the React frontend of the application. It communicates with a separate Java/Spring Boot backend through REST APIs.

The CRM is deployed and actively used internally by 10+ employees at Compact Systems.

## Overview

The application supports the main customer lifecycle:

**Lead → Opportunity → Customer**

It provides employees with a centralized interface for managing customer information, tracking follow-ups, handling CRM workflows, and accessing relevant activity and reporting information.

## Features

### Lead Management

- Create, update, and manage leads
- Track lead status and lifecycle
- Search, filter, sort, and paginate leads
- Manage lead products and related information
- Convert leads into opportunities
- View lead activity and history
- Import and export lead data

### Opportunity Management

- Create and manage opportunities
- Track opportunity stages
- Manage opportunity products
- Manage opportunity follow-ups
- Convert opportunities into customers
- Enforce CRM workflow rules

### Customer Management

- Manage customer records
- View customer information and related records
- Maintain relationships between customers and opportunities

### Follow-ups

- Create and manage follow-up activities
- Track follow-up status and dates
- View follow-up information within CRM records

### Employee Management

- Manage employee information
- Support Admin, Manager, and Employee roles
- Apply role and scope-based access throughout the application

### Activity & History

- View activity history for CRM records
- Track important actions performed by employees
- View changes and remarks associated with CRM records

### Reporting

- View CRM reports and business information
- Filter relevant CRM data
- Export supported report data

### Additional Functionality

- File upload and management
- Email-related workflows
- Data import and export
- Search, filtering, sorting, and pagination across supported records

## Authentication & Access Control

The frontend works with the backend authentication and authorization system.

Users authenticate through the login system, and authenticated API requests use Bearer tokens.

The backend determines access based on the user's role and permissions.

The primary roles are:

- Admin
- Manager
- Employee

The application also supports scope-based access where applicable:

- Own
- Team
- All

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
- Spring Data JPA
- Hibernate
- PostgreSQL
- REST APIs

### Integrations & Deployment

- Supabase Storage
- Brevo API
- Docker
- Render

## Project Structure

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
```

The frontend separates UI components, pages, API service modules, hooks, and utility functions to keep application logic organized.

API communication is handled through dedicated service modules using Axios.

## Local Development

### Prerequisites

- Node.js
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The frontend requires the appropriate backend API configuration to communicate with the CRM backend.

## Deployment

The frontend is deployed on Render and communicates with the separately deployed Spring Boot backend through REST APIs.

## Backend

The backend is maintained in a separate repository:

**Compact CRM Backend**

[Backend Repository](https://github.com/ScepticFlare/crm_backend)

The backend handles authentication, authorization, business logic, database operations, activity logging, file storage, and external integrations.

## Project Status

This is an actively developed internal CRM application used by 10+ employees at Compact Systems.

The application continues to evolve as new business requirements and functionality are introduced.
