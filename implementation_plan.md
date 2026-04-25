# 🎴 CardSocial - Plataforma SaaS de Tarjetas Digitales

## Arquitectura del Sistema

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js 14 App Router)"]
        Login["Login Page"]
        Dashboard["Dashboard"]
        Beneficiaries["Beneficiaries CRUD"]
        Cards["Digital Cards"]
        Benefits["Benefits Management"]
        QRScanner["QR Scanner (PWA)"]
    end
    
    subgraph API["API Routes (Next.js)"]
        AuthAPI["Auth API"]
        BenefAPI["Beneficiaries API"]
        CardAPI["Cards API"]
        BenefitsAPI["Benefits API"]
        ValidateAPI["QR Validation API"]
        BulkAPI["Bulk Upload API"]
    end
    
    subgraph Supabase["Supabase (Backend)"]
        Auth["Supabase Auth"]
        DB["PostgreSQL DB"]
        Storage["File Storage"]
        RLS["Row Level Security"]
    end
    
    Frontend --> API
    API --> Supabase
```

## Database Schema

```mermaid
erDiagram
    organizations ||--o{ org_members : has
    organizations ||--o{ beneficiaries : has
    organizations ||--o{ benefits : has
    beneficiaries ||--o{ digital_cards : has
    beneficiaries ||--o{ benefit_assignments : has
    benefits ||--o{ benefit_assignments : has
    benefit_assignments ||--o{ validation_logs : has

    organizations {
        uuid id PK
        text name
        text slug
        text logo_url
        jsonb settings
        timestamp created_at
    }
    
    org_members {
        uuid id PK
        uuid org_id FK
        uuid user_id FK
        text role
        timestamp created_at
    }
    
    beneficiaries {
        uuid id PK
        uuid org_id FK
        text full_name
        text rut
        text email
        text phone
        text photo_url
        jsonb custom_fields
        text status
        timestamp created_at
    }
    
    digital_cards {
        uuid id PK
        uuid beneficiary_id FK
        uuid org_id FK
        text qr_code
        text status
        timestamp issued_at
        timestamp expires_at
    }
    
    benefits {
        uuid id PK
        uuid org_id FK
        text name
        text description
        text type
        integer quantity
        timestamp start_date
        timestamp end_date
        text status
    }
    
    benefit_assignments {
        uuid id PK
        uuid benefit_id FK
        uuid beneficiary_id FK
        uuid org_id FK
        text status
        timestamp assigned_at
        timestamp used_at
    }
    
    validation_logs {
        uuid id PK
        uuid assignment_id FK
        uuid validated_by FK
        text action
        jsonb metadata
        timestamp created_at
    }
```

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | TailwindCSS 3 |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| QR Generation | `qrcode` npm package |
| QR Scanning | `html5-qrcode` |
| Charts | `recharts` |
| CSV Parsing | `papaparse` |
| PWA | `next-pwa` |

## Implementation Phases

### Phase 1: Foundation ✅
- [x] Next.js project setup
- [x] TailwindCSS configuration
- [x] Supabase client setup
- [x] Database schema
- [x] Auth system
- [x] Core layout components

### Phase 2: Core Features
- [x] Dashboard with analytics
- [x] Beneficiary CRUD
- [x] Digital card generation
- [x] QR code generation
- [x] Benefits management

### Phase 3: Advanced Features
- [x] QR Scanner (PWA camera)
- [x] Bulk CSV/Excel upload
- [x] Validation system
- [x] PWA manifest

### Phase 4: Polish
- [x] Mobile-first responsive design
- [x] Animations & transitions
- [x] Error handling
- [x] Loading states
