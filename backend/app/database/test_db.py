from database import supabase
response = supabase.table("scenarios").select("*").execute()
print(response.data)