"""Rebuild assets/data/announcements_weekly.json from assets/data/covid19_announcements.csv.
Run from the site folder:  python3 tools/build_weekly.py"""
import json
import pandas as pd

NAMES = {'MX': 'Mexico', 'US': 'United States', 'CN-HK': 'Hong Kong', 'CO': 'Colombia', 'BR': 'Brazil',
         'CL': 'Chile', 'CA': 'Canada', 'IN': 'India', 'CN': 'China', 'UK': 'United Kingdom', 'AU': 'Australia',
         'IT': 'Italy', 'KR': 'South Korea', 'CH': 'Switzerland', 'AR': 'Argentina', 'ES': 'Spain', 'FR': 'France',
         'NZ': 'New Zealand', 'JA': 'Japan', 'DE': 'Germany'}
CATS = ['cases', 'live', 'president speech', 'other']

d = pd.read_csv('assets/data/covid19_announcements.csv', index_col=0)
d['time'] = pd.to_datetime(d.time)
d['week'] = d.time.dt.tz_localize(None).dt.to_period('W-SUN').dt.start_time.dt.strftime('%Y-%m-%d')
weeks = sorted(d.week.unique())
out = {'weeks': weeks, 'categories': CATS, 'countries': {}}
for c, g in d.groupby('country'):
    out['countries'][c] = {
        'name': NAMES.get(c, c),
        'total': len(g),
        'share': {cat: round(100 * (g.category == cat).mean()) for cat in CATS},
        'first': g.time.min().strftime('%Y-%m-%d'),
        'series': {cat: [int(x) for x in g[g.category == cat].groupby('week').size().reindex(weeks, fill_value=0)]
                   for cat in CATS},
    }
json.dump(out, open('assets/data/announcements_weekly.json', 'w'), separators=(',', ':'))
print(f"{len(d)} announcements, {len(weeks)} weeks, {len(out['countries'])} countries")
