import psycopg2
from dotenv import load_dotenv
import os

# Load .env
load_dotenv()

# Get the Neon database URL
db_url = os.getenv("DATABASE_URL")

if not db_url:
    raise ValueError("DATABASE_URL not found in environment variables")

conn = psycopg2.connect(db_url)
cur = conn.cursor()
cur.execute("SELECT unnest(enum_range(NULL::withdrawalstatus));")
print(cur.fetchall())



try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # Check existing enum values
    cur.execute("SELECT unnest(enum_range(NULL::withdrawalstatus));")
    print("Before:", cur.fetchall())

    # Rename 'cancelled' to 'CANCELLED'
    try:
        cur.execute("ALTER TYPE withdrawalstatus RENAME VALUE 'cancelled' TO 'CANCELLED';")
        conn.commit()
        print("✅ Renamed 'cancelled' to 'CANCELLED'")
    except psycopg2.errors.DuplicateObject:
        print("⚠️ 'CANCELLED' already exists in enum, skipping rename")

    # Check enum values after change
    cur.execute("SELECT unnest(enum_range(NULL::withdrawalstatus));")
    print("After:", cur.fetchall())

except Exception as e:
    print("❌ Error:", e)
finally:
    cur.close()
    conn.close()
