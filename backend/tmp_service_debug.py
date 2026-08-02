import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('.') / '.env')
print('cwd:', os.getcwd())
print('sys.path[0:5]:', sys.path[:5])

from app.main import app
print('routes count:', len(app.routes))
for route in app.routes:
    if '/scenarios' in route.path:
        print('route:', route.path, route.methods)

from app.services.scenario_service import ScenarioService

async def main():
    svc = ScenarioService()
    scenario_id = '277d95ca-124c-4913-b082-4b5e9226fdb3'
    scenario = await svc.get_scenario(scenario_id)
    print('direct service scenario:', scenario is not None)
    if scenario:
        print('scenario id:', scenario.get('id'))
        print('evidenceCards len:', len(scenario.get('evidenceCards', [])))
        print('referenceRelationships len:', len(scenario.get('referenceRelationships', [])))
        print('scenario keys:', sorted(scenario.keys()))

asyncio.run(main())
