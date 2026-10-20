# ERD NiagaFlow

Diagram relasi database (Mermaid). GitHub menampilkannya otomatis.

```mermaid
erDiagram
    users ||--o{ orders : "membuat (created_by)"
    users ||--o{ order_status_history : "mengubah (changed_by)"
    categories ||--o{ products : "menaungi"
    customers ||--o{ orders : "memesan"
    orders ||--|{ order_items : "berisi"
    orders ||--o{ order_status_history : "punya riwayat"
    products ||--o{ order_items : "dijual di"

    users {
        uuid id PK
        string name
        string email UK
        string password_hash
        enum role "owner | staff"
        datetime created_at
        datetime updated_at
    }

    categories {
        uuid id PK
        string name
        datetime created_at
    }

    products {
        uuid id PK
        uuid category_id FK "boleh kosong"
        string sku UK
        string name
        string description "boleh kosong"
        decimal price "Decimal(12,2)"
        int stock
        int low_stock_threshold
        bool is_active
        datetime created_at
        datetime updated_at
    }

    customers {
        uuid id PK
        string name
        string phone "boleh kosong"
        string notes "boleh kosong"
        datetime created_at
    }

    orders {
        uuid id PK
        string order_number UK
        uuid customer_id FK "boleh kosong"
        uuid created_by FK
        enum status "pending | processing | completed | cancelled"
        decimal subtotal "Decimal(12,2)"
        decimal discount "Decimal(12,2)"
        decimal total "Decimal(12,2)"
        string notes "boleh kosong"
        datetime created_at
        datetime updated_at
    }

    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        string product_name_snapshot "nama saat pesanan dibuat"
        decimal unit_price "Decimal(12,2)"
        int quantity
        decimal line_total "Decimal(12,2)"
    }

    order_status_history {
        uuid id PK
        uuid order_id FK
        uuid changed_by FK
        string old_status "boleh kosong"
        string new_status
        datetime changed_at
    }
```

## Catatan penting

- **Uang** disimpan sebagai `Decimal(12,2)` di database, tapi dikirim ke frontend sebagai bilangan bulat rupiah. Lihat `apps/api/src/utils/serialize.ts`.
- **Nama produk disalin** ke `order_items.product_name_snapshot` saat pesanan dibuat. Jadi kalau produk nanti diganti nama, riwayat pesanan lama tidak ikut berubah.
- **Stok** dikurangi saat pesanan dibuat dan dikembalikan saat pesanan dibatalkan, keduanya dalam satu transaksi database.
- **Riwayat status** disimpan terpisah di `order_status_history`, mencatat siapa yang mengubah, dari status apa, ke status apa, dan kapan.
- **Pelanggan bersifat opsional** pada pesanan (`customer_id` boleh kosong) untuk pesanan langsung di tempat.
