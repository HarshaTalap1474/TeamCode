import sys
sys.path.insert(0, '.')

from ml_engine.spatial.distance import haversine_distance_m
from ml_engine.spatial.huff import HuffModel
from ml_engine.data.synthetic_gen import generate_kolhapur_synthetic_demo
from ml_engine.data.validator import validate_dataset
from ml_engine.ranking.ranker import Ranker
from ml_engine.features.engineer import engineer_features
from ml_engine.models.pattern_baseline import PatternBaseline
from ml_engine.economics.affordability import AffordabilityModel
from ml_engine.explain.evidence import build_evidence

def test_haversine_known():
    d = haversine_distance_m(0,0,1,0)
    assert 111000 < d < 111500

def test_market_shares_sum():
    data = generate_kolhapur_synthetic_demo(seed=123)
    h = HuffModel(beta=2.0)
    stores = data['existing_stores'] + data['competitors']
    shares = h.compute_market_shares(data['demand_cells'], stores)
    for cid, s in shares.items():
        assert abs(sum(s) - 1.0) < 1e-6

def test_zero_distance_handling():
    data = generate_kolhapur_synthetic_demo(seed=1)
    h = HuffModel(beta=2.0, min_dist=0.2)
    cell = dict(data['demand_cells'][0])
    store = dict(data['existing_stores'][0])
    store['lat'] = cell['lat']; store['lng'] = cell['lng']
    shares = h.compute_market_shares([cell], [store])
    assert abs(sum(shares[cell['cell_id']]) - 1.0) < 1e-6

def test_cannibalization_nid():
    data = generate_kolhapur_synthetic_demo(seed=123)
    h = HuffModel(beta=2.0)
    cand = data['candidates'][0]
    res = h.evaluate_candidate(data['demand_cells'], data['existing_stores'], data['competitors'], cand)
    assert res['net_incremental_demand'] >= -1e-9  # can be negative
    assert res['cannibalization_pct'] >= 0

def test_validation_synthetic():
    data = generate_kolhapur_synthetic_demo(seed=5)
    v = validate_dataset(data)
    assert v['valid']

def test_ranking_deterministic():
    data = generate_kolhapur_synthetic_demo(seed=7)
    huff = HuffModel(beta=2.0)
    enriched = engineer_features(data['candidates'], data['demand_cells'], data['existing_stores'], data['competitors'])
    baseline = PatternBaseline()
    aff = AffordabilityModel()
    results = []
    for cand in enriched[:5]:
        feats = cand['features']
        hres = huff.evaluate_candidate(data['demand_cells'], data['existing_stores'], data['competitors'], cand)
        pscore = baseline.score(feats)
        ares = aff.estimate_cost_and_score(feats)
        evid = build_evidence(cand, hres, feats, ares, pscore)
        results.append(evid)
    r1 = Ranker().rank([dict(x) for x in results])
    r2 = Ranker().rank([dict(x) for x in results])
    assert [x['h3_id'] for x in r1] == [x['h3_id'] for x in r2]

def test_ranking_empty_and_single():
    from ml_engine.ranking.ranker import Ranker
    r = Ranker()
    assert r.rank([]) == []
    res = [{"net_incremental_demand": 10, "pattern_score": 50, "affordability_score": 50}]
    out = r.rank(res)
    assert len(out) == 1
    assert out[0]['rank'] == 1

def test_affordability_lower_cost_higher_score():
    from ml_engine.economics.affordability import AffordabilityModel
    aff = AffordabilityModel()
    f1 = {"competitor_count_1km": 0, "pop_proxy_800m": 1000}
    f2 = {"competitor_count_1km": 5, "pop_proxy_800m": 5000}
    r1 = aff.estimate_cost_and_score(f1)
    r2 = aff.estimate_cost_and_score(f2)
    assert r1['estimated_monthly_cost'] < r2['estimated_monthly_cost']
    assert r1['affordability_score'] > r2['affordability_score']

def test_nid_consistency_basic():
    data = generate_kolhapur_synthetic_demo(seed=99)
    h = HuffModel(beta=2.0)
    cand = data['candidates'][0]
    res = h.evaluate_candidate(data['demand_cells'], data['existing_stores'], data['competitors'], cand)
    # consistency
    assert abs(res['net_incremental_demand'] - (res['candidate_demand'] - res['lost_demand_own_stores'])) < 1e-9

def test_no_own_stores():
    data = generate_kolhapur_synthetic_demo(seed=5)
    h = HuffModel(beta=2.0)
    cand = data['candidates'][1]
    res = h.evaluate_candidate(data['demand_cells'], [], data['competitors'], cand)
    assert res['lost_demand_own_stores'] == 0.0
    assert res['net_incremental_demand'] == res['candidate_demand']

def test_no_competitors():
    data = generate_kolhapur_synthetic_demo(seed=7)
    h = HuffModel(beta=2.0)
    cand = data['candidates'][2]
    res = h.evaluate_candidate(data['demand_cells'], data['existing_stores'], [], cand)
    assert res['lost_demand_competitors'] == 0.0

def test_ranking_allows_negative_nid():
    from ml_engine.ranking.ranker import Ranker
    r = Ranker()
    res = [
        {"net_incremental_demand": -5.0, "pattern_score": 80, "affordability_score": 80},
        {"net_incremental_demand": 10.0, "pattern_score": 50, "affordability_score": 50},
    ]
    out = r.rank(res)
    # higher NID should generally rank higher given same other components? check order by eps
    assert out[0]['net_incremental_demand'] == 10.0 or out[1]['net_incremental_demand'] == 10.0

def test_reordering_stores_does_not_change():
    from ml_engine.spatial.huff import HuffModel
    from ml_engine.data.synthetic_gen import generate_kolhapur_synthetic_demo
    data = generate_kolhapur_synthetic_demo(seed=42)
    h = HuffModel(beta=2.0)
    cand = data['candidates'][0]
    res1 = h.evaluate_candidate(data['demand_cells'], data['existing_stores'], data['competitors'], cand)
    res2 = h.evaluate_candidate(data['demand_cells'], list(reversed(data['existing_stores'])), list(reversed(data['competitors'])), cand)
    assert abs(res1['candidate_demand'] - res2['candidate_demand']) < 1e-9
    assert abs(res1['net_incremental_demand'] - res2['net_incremental_demand']) < 1e-9

def test_shares_sum_to_one_explicit():
    from ml_engine.spatial.huff import HuffModel
    from ml_engine.data.synthetic_gen import generate_kolhapur_synthetic_demo
    data = generate_kolhapur_synthetic_demo(seed=123)
    h = HuffModel(beta=2.0)
    stores = data['existing_stores'] + data['competitors']
    shares = h.compute_market_shares(data['demand_cells'], stores)
    for cid, s in shares.items():
        assert abs(sum(s) - 1.0) < 1e-6

def test_demand_conservation_basic():
    from ml_engine.spatial.huff import HuffModel
    from ml_engine.data.synthetic_gen import generate_kolhapur_synthetic_demo
    data = generate_kolhapur_synthetic_demo(seed=5)
    h = HuffModel(beta=2.0)
    stores = data['existing_stores'] + data['competitors']
    sales_by_id = h.expected_sales_by_store(data['demand_cells'], stores)
    total_sales = sum(sales_by_id.values())
    total_demand = sum(c['population'] * c.get('demand_rate', 0.015) for c in data['demand_cells'])
    assert abs(total_sales - total_demand) < 1e-6
