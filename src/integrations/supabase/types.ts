export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string | null
        }
        Relationships: []
      }

      customers: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          address: string | null
          city: string | null
          pincode: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          address?: string | null
          city?: string | null
          pincode?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          address?: string | null
          city?: string | null
          pincode?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }

      expenses: {
        Row: {
          id: number
          title: string
          category: string | null
          amount: number
          expense_date: string
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          title: string
          category?: string | null
          amount: number
          expense_date: string
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          category?: string | null
          amount?: number
          expense_date?: string
          notes?: string | null
          created_at?: string | null
        }
        Relationships: []
      }

      inventory_transactions: {
        Row: {
          id: number
          product_id: number
          transaction_type: string
          quantity: number
          reference_type: string | null
          reference_id: number | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          product_id: number
          transaction_type: string
          quantity: number
          reference_type?: string | null
          reference_id?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          product_id?: number
          transaction_type?: string
          quantity?: number
          reference_type?: string | null
          reference_id?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }

      invoices: {
        Row: {
          id: number
          order_id: number | null
          invoice_number: string
          invoice_date: string
          customer_name: string
          customer_phone: string | null
          customer_address: string | null
          subtotal: number
          discount: number
          total: number
          payment_method: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          order_id?: number | null
          invoice_number: string
          invoice_date: string
          customer_name: string
          customer_phone?: string | null
          customer_address?: string | null
          subtotal: number
          discount: number
          total: number
          payment_method?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          order_id?: number | null
          invoice_number?: string
          invoice_date?: string
          customer_name?: string
          customer_phone?: string | null
          customer_address?: string | null
          subtotal?: number
          discount?: number
          total?: number
          payment_method?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }

      order_items: {
        Row: {
          id: number
          order_id: number
          product_id: number | null
          product_name: string
          brand: string | null
          quantity: number
          unit_price: number
          discount: number
          total: number
          created_at: string | null
        }
        Insert: {
          id?: number
          order_id: number
          product_id?: number | null
          product_name: string
          brand?: string | null
          quantity: number
          unit_price: number
          discount: number
          total: number
          created_at?: string | null
        }
        Update: {
          id?: number
          order_id?: number
          product_id?: number | null
          product_name?: string
          brand?: string | null
          quantity?: number
          unit_price?: number
          discount?: number
          total?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }

      orders: {
        Row: {
          id: number
          customer_id: string | null
          customer_name: string
          customer_phone: string
          customer_email: string | null
          delivery_address: string
          city: string | null
          pincode: string | null
          notes: string | null
          subtotal: number
          discount: number
          total: number
          payment_method: string
          payment_status: string
          order_status: string
          rejection_reason: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          delivery_address: string
          city?: string | null
          pincode?: string | null
          notes?: string | null
          subtotal: number
          discount: number
          total: number
          payment_method: string
          payment_status: string
          order_status: string
          rejection_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          delivery_address?: string
          city?: string | null
          pincode?: string | null
          notes?: string | null
          subtotal?: number
          discount?: number
          total?: number
          payment_method?: string
          payment_status?: string
          order_status?: string
          rejection_reason?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }

      product_images: {
        Row: {
          id: number
          product_id: number
          image_url: string
          is_primary: boolean
          created_at: string | null
        }
        Insert: {
          id?: number
          product_id: number
          image_url: string
          is_primary: boolean
          created_at?: string | null
        }
        Update: {
          id?: number
          product_id?: number
          image_url?: string
          is_primary?: boolean
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }

      products: {
        Row: {
          id: number
          name: string
          brand: string | null
          category_id: number | null
          description: string | null
          specifications: Json | null
          price: number
          cost_price: number | null
          discount: number | null
          stock_quantity: number
          low_stock_threshold: number
          warranty: string | null
          featured: boolean
          active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          brand?: string | null
          category_id?: number | null
          description?: string | null
          specifications?: Json | null
          price: number
          cost_price?: number | null
          discount?: number | null
          stock_quantity: number
          low_stock_threshold: number
          warranty?: string | null
          featured: boolean
          active: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          brand?: string | null
          category_id?: number | null
          description?: string | null
          specifications?: Json | null
          price?: number
          cost_price?: number | null
          discount?: number | null
          stock_quantity?: number
          low_stock_threshold?: number
          warranty?: string | null
          featured?: boolean
          active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }

      purchase_items: {
        Row: {
          id: number
          purchase_id: number
          product_id: number | null
          product_name: string
          quantity: number
          unit_cost: number
          total: number
          created_at: string | null
        }
        Insert: {
          id?: number
          purchase_id: number
          product_id?: number | null
          product_name: string
          quantity: number
          unit_cost: number
          total: number
          created_at?: string | null
        }
        Update: {
          id?: number
          purchase_id?: number
          product_id?: number | null
          product_name?: string
          quantity?: number
          unit_cost?: number
          total?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }

      purchases: {
        Row: {
          id: number
          supplier_id: number | null
        }
        Insert: {
          id?: number
          supplier_id?: number | null
        }
        Update: {
          id?: number
          supplier_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }

      reviews: {
        Row: {
          id: number
          product_id: number
          customer_id: string | null
          customer_name: string
          rating: number
          review_text: string | null
          visible: boolean
          created_at: string | null
        }
        Insert: {
          id?: number
          product_id: number
          customer_id?: string | null
          customer_name: string
          rating: number
          review_text?: string | null
          visible: boolean
          created_at?: string | null
        }
        Update: {
          id?: number
          product_id?: number
          customer_id?: string | null
          customer_name?: string
          rating?: number
          review_text?: string | null
          visible?: boolean
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }

      suppliers: {
        Row: {
          id: number
          name: string
          phone: string | null
          email: string | null
          address: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      [_ in never]: never
    }

    Enums: {
      [_ in never]: never
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}
