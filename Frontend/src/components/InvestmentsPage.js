import React, { useEffect, useMemo, useState } from 'react';
import { accountAPI, investmentAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import './InvestmentsPage.css';

const currency = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

const numberValue = (value, digits = 4) =>
  Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: digits,
  });

const riskClass = (risk) => `risk-pill ${risk || 'low'}`;

const buildPath = (values, width = 320, height = 120) => {
  if (!values.length) return '';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
};

const Sparkline = ({ points = [], positive = true }) => {
  const values = points.map((point) => Number(point.nav_value || point.value || 0)).filter(Number.isFinite);
  const path = buildPath(values, 160, 48);

  if (!path) return <div className="sparkline-empty" />;

  return (
    <svg className="sparkline" viewBox="0 0 160 48" preserveAspectRatio="none">
      <path className={positive ? 'positive' : 'negative'} d={path} />
    </svg>
  );
};

const LineChart = ({ points = [] }) => {
  const values = points.map((point) => Number(point.value || 0)).filter(Number.isFinite);
  const path = buildPath(values, 520, 180);
  const fillPath = path ? `${path} L 520 180 L 0 180 Z` : '';

  return (
    <div className="investment-chart-panel">
      <div className="chart-panel-header">
        <div>
          <span>Portfolio Trend</span>
          <h3>Estimated Value Movement</h3>
        </div>
      </div>
      {path ? (
        <svg className="portfolio-line-chart" viewBox="0 0 520 180" preserveAspectRatio="none">
          <path className="chart-fill" d={fillPath} />
          <path className="chart-line" d={path} />
        </svg>
      ) : (
        <div className="chart-empty">Buy your first product to build a trend.</div>
      )}
    </div>
  );
};

const DonutChart = ({ slices = [] }) => {
  const total = slices.reduce((sum, slice) => sum + Number(slice.value || 0), 0);
  const colors = ['#60a5fa', '#34d399', '#f59e0b', '#f87171', '#a78bfa'];
  let offset = 25;

  return (
    <div className="investment-chart-panel allocation-panel">
      <div className="chart-panel-header">
        <div>
          <span>Allocation</span>
          <h3>Portfolio Mix</h3>
        </div>
      </div>
      {total > 0 ? (
        <div className="allocation-content">
          <svg className="donut-chart" viewBox="0 0 42 42">
            <circle className="donut-base" cx="21" cy="21" r="15.915" />
            {slices.map((slice, index) => {
              const percent = (Number(slice.value || 0) / total) * 100;
              const circle = (
                <circle
                  key={slice.label}
                  className="donut-slice"
                  cx="21"
                  cy="21"
                  r="15.915"
                  stroke={colors[index % colors.length]}
                  strokeDasharray={`${percent} ${100 - percent}`}
                  strokeDashoffset={offset}
                />
              );
              offset -= percent;
              return circle;
            })}
          </svg>
          <div className="allocation-legend">
            {slices.map((slice, index) => (
              <div key={slice.label}>
                <i style={{ background: colors[index % colors.length] }} />
                <span>{slice.label}</span>
                <strong>{Math.round((Number(slice.value || 0) / total) * 100)}%</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="chart-empty">Allocation appears after your first holding.</div>
      )}
    </div>
  );
};

const InvestmentActionModal = ({
  type,
  product,
  accounts,
  holding,
  onClose,
  onSuccess,
}) => {
  const isBuy = type === 'buy';
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.account_id || '');
  const [amount, setAmount] = useState('');
  const [units, setUnits] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const estimatedUnits = useMemo(() => {
    if (!isBuy || !amount || !product?.nav_value) return 0;
    return Number(amount) / Number(product.nav_value);
  }, [amount, isBuy, product]);

  const estimatedRedemption = useMemo(() => {
    if (isBuy || !units || !product?.nav_value) return 0;
    return Number(units) * Number(product.nav_value);
  }, [isBuy, product, units]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        source_account_id: sourceAccountId,
        product_id: product.product_id,
      };

      const res = isBuy
        ? await investmentAPI.buyInvestment({ ...payload, amount: Number(amount) })
        : await investmentAPI.sellInvestment({ ...payload, units: Number(units) });

      if (res.success) onSuccess();
    } catch (err) {
      if (err.data?.errors?.length) {
        setError(err.data.errors.join('\n'));
      } else {
        setError(err.data?.message || err.message || 'Investment action failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content investment-modal">
        <div className="modal-header">
          <h2>{isBuy ? 'Buy Investment' : 'Redeem Investment'}</h2>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            <i className="fas fa-times" />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger investment-alert">
            {error}
          </div>
        )}

        <div className="investment-modal-product">
          <div>
            <span className="investment-product-type">{product.investment_type?.replace('_', ' ')}</span>
            <h3>{product.product_name}</h3>
          </div>
          <span className={riskClass(product.risk_level)}>{product.risk_level}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="investment-form-grid">
            <div className="form-group">
              <label>Source Account</label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                required
              >
                {accounts.length === 0 && <option value="">No active accounts found</option>}
                {accounts.map((account) => (
                  <option key={account.account_id} value={account.account_id}>
                    {account.account_type.toUpperCase()} - ****{account.account_number.slice(-4)} ({currency(account.balance)})
                  </option>
                ))}
              </select>
            </div>

            {isBuy ? (
              <div className="form-group">
                <label>Investment Amount</label>
                <div className="investment-input-with-icon">
                  <span>₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(''); }}
                    placeholder="e.g. 5000"
                    min={Number(product.minimum_investment || 1)}
                    required
                  />
                </div>
                <small>Minimum {currency(product.minimum_investment)}</small>
              </div>
            ) : (
              <div className="form-group">
                <label>Units to Redeem</label>
                <input
                  type="number"
                  value={units}
                  onChange={(e) => { setUnits(e.target.value); setError(''); }}
                  placeholder="e.g. 10"
                  min="0.000001"
                  step="0.000001"
                  max={holding ? Number(holding.units) : undefined}
                  required
                />
                <small>Available units: {numberValue(holding?.units, 6)}</small>
              </div>
            )}
          </div>

          <div className="investment-preview">
            <div>
              <span>Current NAV</span>
              <strong>{currency(product.nav_value)}</strong>
            </div>
            <div>
              <span>{isBuy ? 'Estimated Units' : 'Estimated Credit'}</span>
              <strong>{isBuy ? numberValue(estimatedUnits, 6) : currency(estimatedRedemption)}</strong>
            </div>
          </div>

          <div className="investment-modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || accounts.length === 0}>
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin" /> Processing...</>
              ) : (
                <>{isBuy ? 'Confirm Buy' : 'Confirm Redemption'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InvestmentsPage = () => {
  const { showToast, currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [portfolioData, setPortfolioData] = useState({ portfolio: null, holdings: [] });
  const [statement, setStatement] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState(null);
  const [activeTab, setActiveTab] = useState('products');

  const loadInvestments = async () => {
    try {
      setIsLoading(true);

      const [marketRes, portfolioRes, statementRes, accountsRes] = await Promise.all([
        investmentAPI.getMarketOverview(),
        investmentAPI.getPortfolio(),
        investmentAPI.getStatement(),
        accountAPI.getMyAccounts(),
      ]);

      if (marketRes.success) setProducts(marketRes.data || []);
      if (portfolioRes.success) setPortfolioData(portfolioRes.data || { portfolio: null, holdings: [] });
      if (statementRes.success) setStatement(statementRes.data?.transactions || []);
      if (accountsRes.success) setAccounts(accountsRes.data || []);
    } catch (err) {
      showToast('error', err.data?.message || err.message || 'Failed to load investments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, []); // eslint-disable-line

  const holdingByProductId = useMemo(() => {
    const map = new Map();
    (portfolioData.holdings || []).forEach((holding) => {
      map.set(holding.product_id, holding);
    });
    return map;
  }, [portfolioData.holdings]);

  const handleActionSuccess = () => {
    setSelectedAction(null);
    showToast('success', 'Investment action completed successfully');
    loadInvestments();
  };

  if (isLoading) return <LoadingSpinner text="Loading investments..." />;

  const portfolio = portfolioData.portfolio;
  const holdings = portfolioData.holdings || [];
  const canInvest = currentUser?.kyc_status === 'verified';
  const allocationSlices = Object.values(holdings.reduce((acc, holding) => {
    const type = holding.product?.investment_type?.replace('_', ' ') || 'other';
    if (!acc[type]) acc[type] = { label: type, value: 0 };
    acc[type].value += Number(holding.current_value || 0);
    return acc;
  }, {}));
  const trendPoints = statement
    .slice()
    .reverse()
    .reduce((points, item) => {
      const previous = points[points.length - 1]?.value || 0;
      const amount = Number(item.amount || 0);
      const nextValue = item.transaction_type === 'sell'
        ? Math.max(0, previous - amount)
        : previous + amount;
      points.push({
        date: item.created_at,
        value: nextValue,
      });
      return points;
    }, []);

  if (portfolio?.current_value && trendPoints.length) {
    trendPoints[trendPoints.length - 1].value = Number(portfolio.current_value);
  }

  return (
    <div className="investments-page">
      <div className="page-header investments-header">
        <div>
          <h1>Investments</h1>
          <p>Build your portfolio with mutual funds, equity, bonds, and gold</p>
        </div>
        <span className={`kyc-investment-badge ${canInvest ? 'ready' : 'pending'}`}>
          <i className={`fas ${canInvest ? 'fa-check-circle' : 'fa-clock'}`} />
          {canInvest ? 'KYC Ready' : 'KYC Required'}
        </span>
      </div>

      <div className="investment-summary-grid">
        <div className="investment-summary-item">
          <span>Total Invested</span>
          <strong>{currency(portfolio?.total_invested)}</strong>
        </div>
        <div className="investment-summary-item">
          <span>Current Value</span>
          <strong>{currency(portfolio?.current_value)}</strong>
        </div>
        <div className="investment-summary-item">
          <span>Total Returns</span>
          <strong className={Number(portfolio?.total_returns || 0) >= 0 ? 'return-positive' : 'return-negative'}>
            {currency(portfolio?.total_returns)}
          </strong>
        </div>
        <div className="investment-summary-item">
          <span>Risk Profile</span>
          <strong className="capitalize">{portfolio?.risk_profile || 'Not started'}</strong>
        </div>
      </div>

      <div className="investment-visual-grid">
        <LineChart points={trendPoints} />
        <DonutChart slices={allocationSlices} />
      </div>

      <div className="investment-tabs">
        <button
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Products
        </button>
        <button
          className={activeTab === 'holdings' ? 'active' : ''}
          onClick={() => setActiveTab('holdings')}
        >
          Holdings
        </button>
        <button
          className={activeTab === 'statement' ? 'active' : ''}
          onClick={() => setActiveTab('statement')}
        >
          Statement
        </button>
      </div>

      {activeTab === 'products' && (
        products.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-chart-line" />
            <h3>No Investment Products</h3>
            <p>Restart the backend once so the default investment catalog can be created.</p>
          </div>
        ) : (
          <div className="investment-product-grid">
            {products.map((product) => {
              const holding = holdingByProductId.get(product.product_id);
              return (
                <div key={product.product_id} className="investment-product-card">
                  <div className="investment-card-top">
                    <span className="investment-product-type">{product.investment_type?.replace('_', ' ')}</span>
                    <span className={riskClass(product.risk_level)}>{product.risk_level}</span>
                  </div>
                  <h3>{product.product_name}</h3>
                  <div className="investment-metrics">
                    <div><span>NAV</span><strong>{currency(product.nav_value)}</strong></div>
                    <div><span>Minimum</span><strong>{currency(product.minimum_investment)}</strong></div>
                    <div>
                      <span>30D Change</span>
                      <strong className={Number(product.change_percent || 0) >= 0 ? 'return-positive' : 'return-negative'}>
                        {Number(product.change_percent || 0).toFixed(2)}%
                      </strong>
                    </div>
                  </div>
                  <Sparkline
                    points={product.nav_history || []}
                    positive={Number(product.change_percent || 0) >= 0}
                  />
                  <div className="investment-card-actions">
                    <button
                      className="btn btn-primary"
                      disabled={!canInvest}
                      onClick={() => setSelectedAction({ type: 'buy', product })}
                    >
                      <i className="fas fa-plus" /> Buy
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={!holding}
                      onClick={() => setSelectedAction({ type: 'sell', product, holding })}
                    >
                      <i className="fas fa-arrow-up" /> Redeem
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {activeTab === 'holdings' && (
        holdings.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-briefcase" />
            <h3>No Holdings Yet</h3>
            <p>Your purchased investments will appear here.</p>
          </div>
        ) : (
          <div className="investment-table-wrap">
            <table className="investment-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units</th>
                  <th>Avg NAV</th>
                  <th>Invested</th>
                  <th>Current Value</th>
                  <th>Returns</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => {
                  const returns = Number(holding.current_value || 0) - Number(holding.invested_amount || 0);
                  return (
                    <tr key={holding.holding_id}>
                      <td>
                        <strong>{holding.product?.product_name || 'Investment Product'}</strong>
                        <span>{holding.product?.investment_type?.replace('_', ' ')}</span>
                      </td>
                      <td>{numberValue(holding.units, 6)}</td>
                      <td>{currency(holding.average_nav)}</td>
                      <td>{currency(holding.invested_amount)}</td>
                      <td>{currency(holding.current_value)}</td>
                      <td className={returns >= 0 ? 'return-positive' : 'return-negative'}>{currency(returns)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'statement' && (
        statement.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-file-invoice" />
            <h3>No Investment Transactions</h3>
            <p>Your buy and redemption history will appear here.</p>
          </div>
        ) : (
          <div className="investment-table-wrap">
            <table className="investment-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Units</th>
                  <th>NAV</th>
                </tr>
              </thead>
              <tbody>
                {statement.map((item) => (
                  <tr key={item.transaction_id}>
                    <td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td>
                    <td><span className={`transaction-type ${item.transaction_type}`}>{item.transaction_type}</span></td>
                    <td>
                      <strong>{item.product?.product_name || 'Investment Product'}</strong>
                      <span>{item.product?.investment_type?.replace('_', ' ')}</span>
                    </td>
                    <td>{currency(item.amount)}</td>
                    <td>{numberValue(item.units, 6)}</td>
                    <td>{currency(item.nav_at_execution)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {selectedAction && (
        <InvestmentActionModal
          type={selectedAction.type}
          product={selectedAction.product}
          holding={selectedAction.holding}
          accounts={accounts}
          onClose={() => setSelectedAction(null)}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
};

export default InvestmentsPage;
