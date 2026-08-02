import asyncio
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path('.') / '.env')
from database.supabase import get_supabase_client

async def main():
    client = await get_supabase_client()
    scenario_id = '277d95ca-124c-4913-b082-4b5e9226fdb3'
    evidence_query = client.table('evidence').select('*').eq('scenario_id', scenario_id)
    evidence_url = evidence_query._build_url()
    evidence_resp = await evidence_query.execute()
    print('EVIDENCE QUERY URL:', evidence_url)
    print('EVIDENCE ROW COUNT:', len(evidence_resp.data or []))
    print('EVIDENCE SAMPLE:', (evidence_resp.data or [])[:3])

    scenario_query = client.table('scenarios').select('*').eq('id', scenario_id).limit(1)
    scenario_url = scenario_query._build_url()
    scenario_resp = await scenario_query.execute()
    print('SCENARIO QUERY URL:', scenario_url)
    print('SCENARIO ROW COUNT:', len(scenario_resp.data or []))
    print('SCENARIO SAMPLE:', (scenario_resp.data or [])[:1])

asyncio.run(main())
