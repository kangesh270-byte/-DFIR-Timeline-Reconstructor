from app.database.supabase import SupabaseRestClient


def test_builds_expected_query_string_for_filtered_requests() -> None:
    client = SupabaseRestClient("https://example.supabase.co", "service-role-key")
    query = client.table("scenarios").select("*").eq("id", "scenario-01").order("created_at", desc=True).limit(1)

    assert query._build_url() == "https://example.supabase.co/rest/v1/scenarios?select=%2A&id=eq.scenario-01&order=created_at.desc&limit=1"
