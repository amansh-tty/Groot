import { useState } from 'react';
import {
  DesignSystemRoot,
  DashboardPanel,
  DashboardAction,
  Text,
} from '../../../packages/design-system/src';
import * as assets from './assets';
import './dashboard.css';

type Asset = keyof typeof assets;
function Icon({ name, className = '' }: { name: Asset; className?: string }) {
  return <img className={'sp-icon ' + className} src={assets[name]} alt="" />;
}
const menu: [string, Asset][] = [
  ['Dashboard', 'imgHome'],
  ['Insight', 'imgStatusUp'],
  ['Invoices', 'imgDocumentText'],
  ['Products', 'imgVuesaxLinearBox'],
  ['Reimburse', 'imgEmptyWalletChange'],
  ['Inbox', 'imgMessage'],
  ['People & Teams', 'imgMessage'],
];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'];
const heights = [148, 82, 168, 120, 96, 180, 120, 130, 180, 158, 120, 167];
const categories = [
  ['Employees Salary', '$8.000.00', '#EB7CA6'],
  ['Material Supplies', '$2.130.00', '#FFACC8'],
  ['Company tax', '$1.510.00', '#CC6FF8'],
  ['Maintenance system', '$2.245.00', '#7C5CFC'],
  ['Development System', '$4.385.00', '#5CAFFC'],
  ['Production Tools', '$1.000.00', '#A1A9FE'],
];
const records: {
  id: number;
  name: string;
  date: string;
  status: string;
  icon: Asset;
  dot: Asset;
}[] = [
  {
    id: 1,
    name: 'Bank Transfer',
    date: 'Jan 01,2022',
    status: 'Completed',
    icon: 'imgEllipse8',
    dot: 'imgFrame33699',
  },
  {
    id: 2,
    name: 'Paypal Account',
    date: 'Jan 04,2022',
    status: 'Pending',
    icon: 'imgGroup33696',
    dot: 'imgFrame33700',
  },
  {
    id: 3,
    name: 'Bank Transfer',
    date: 'Jan 06,2022',
    status: 'On Hold',
    icon: 'imgGroup33697',
    dot: 'imgFrame33701',
  },
];
export default function Dashboard() {
  const [navigation, setNavigation] = useState('Dashboard');
  const [query, setQuery] = useState('');
  const [hover, setHover] = useState<number | null>(5);
  const [year, setYear] = useState(2024);
  const [sort, setSort] = useState<{ field: 'date' | 'amount' | 'status'; descending: boolean }>({
    field: 'date',
    descending: false,
  });
  const [notice, setNotice] = useState('');
  const [category, setCategory] = useState<number | null>(null);
  const unsupported = (name: string) =>
    setNotice(`${name}: the destination or open state is not supplied in this Figma frame.`);
  const rows = records
    .filter((row) =>
      `${row.name} ${row.date} ${row.status} $2,000.00`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => {
      const comparison =
        sort.field === 'date'
          ? a.id - b.id
          : sort.field === 'status'
            ? a.status.localeCompare(b.status)
            : 0;
      return sort.descending ? -comparison : comparison;
    });
  function selectNav(name: string) {
    setNavigation(name);
    if (name !== 'Dashboard') unsupported(name);
    else setNotice('');
  }
  function sortBy(field: typeof sort.field) {
    setSort({ field, descending: sort.field === field ? !sort.descending : false });
  }
  return (
    <DesignSystemRoot>
      <div className="sp-scroll">
        <div className="sp-dashboard" data-playground-screen="dashboard">
          <aside className="sp-sidebar">
            <div className="sp-logo">
              <Icon name="imgLayer1" />
              <strong>Spend.In</strong>
            </div>
            <nav aria-label="Main Menu">
              <p className="sp-nav-label">Main Menu</p>
              {menu.map(([name, icon]) => (
                <button
                  key={name}
                  aria-current={navigation === name ? 'page' : undefined}
                  className={navigation === name ? 'selected' : ''}
                  onClick={() => selectNav(name)}
                >
                  <Icon name={icon} />
                  {name}
                </button>
              ))}
            </nav>
            <nav className="sp-preferences" aria-label="Preferences">
              <p className="sp-nav-label">Preferences</p>
              {(
                [
                  ['Settings', 'imgSetting'],
                  ['Help & Center', 'imgInfoCircle'],
                ] as [string, Asset][]
              ).map(([name, icon]) => (
                <button
                  key={name}
                  onClick={() => selectNav(name)}
                  aria-current={navigation === name ? 'page' : undefined}
                  className={navigation === name ? 'selected' : ''}
                >
                  <Icon name={icon} />
                  {name}
                </button>
              ))}
              <button
                onClick={() => unsupported('Dark Mode')}
                aria-label="Dark Mode — design not supplied"
              >
                <Icon name="imgBriefcase" />
                Dark Mode
                <span className="sp-mode">
                  <span>
                    <Icon name="imgSun" />
                  </span>
                  <Icon name="imgVuesaxLinearMoon" />
                </span>
              </button>
            </nav>
            <button className="sp-logout" onClick={() => unsupported('Log Out')}>
              <Icon name="imgVuesaxLinearLogout" />
              Log Out
            </button>
          </aside>
          <header className="sp-header">
            <label className="sp-search">
              <Icon name="imgSearchNormal" />
              <input
                aria-label="Search something here"
                placeholder="Search something here"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    document.querySelector<HTMLInputElement>('.sp-search input')?.focus();
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>
            <div className="sp-profile">
              <button
                className="sp-notifications"
                aria-label="Notifications"
                onClick={() => unsupported('Notifications')}
              >
                <Icon name="imgVuesaxLinearNotification" />
                <Icon name="imgEllipse1" className="notification-dot" />
              </button>
              <button className="sp-account" onClick={() => unsupported('John Cornors account')}>
                <img src={assets.imgRectangle17} alt="" />
                <Text variant="Semibold/Type@16">John Cornors</Text>
                <Icon name="imgArrowDown" />
              </button>
            </div>
          </header>
          <main className="sp-content" aria-label="Dashboard">
            <div className="sp-main-column">
              <DashboardPanel className="sp-statistics" aria-label="Spending Statistics">
                <div className="sp-panel-heading">
                  <Text variant="Semibold/Type@16">Spending Statistics</Text>
                  <div className="sp-year">
                    <button
                      aria-label="Previous year"
                      onClick={() => {
                        setYear(year - 1);
                        setHover(null);
                      }}
                    >
                      <Icon name="imgArrowLeft" />
                    </button>
                    <span>{year}</span>
                    <button
                      aria-label="Next year"
                      onClick={() => {
                        setYear(year + 1);
                        setHover(null);
                      }}
                    >
                      <Icon name="imgArrowRight" />
                    </button>
                  </div>
                </div>
                {year === 2024 ? (
                  <div className="sp-chart" data-playground-id="spending-chart">
                    <div className="sp-axis">
                      {['$15k', '$10k', '$5k', '$1k', '$500'].map((label, index) => (
                        <span style={{ top: index * 38 }} key={label}>
                          {label}
                        </span>
                      ))}
                    </div>
                    <div className="sp-grid-lines">
                      {[0, 1, 2, 3, 4].map((index) => (
                        <img
                          key={index}
                          src={index === 1 ? assets.imgVector6 : assets.imgVector5}
                          alt=""
                          style={{ top: index * 38 }}
                        />
                      ))}
                    </div>
                    <div className="sp-bars">
                      {months.map((month, index) => (
                        <button
                          key={month}
                          className={'sp-bar-target ' + (hover === index ? 'active' : '')}
                          aria-label={`${month} expense${index === 5 ? ' $15.030' : '; exact value not supplied'}`}
                          onMouseEnter={() => setHover(index)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={() => setHover(index)}
                          onBlur={() => setHover(null)}
                          onClick={() => setHover(index)}
                        >
                          <span className="sp-bar" style={{ height: heights[index] }} />
                          <span className="sp-month">{month}</span>
                        </button>
                      ))}
                    </div>
                    {hover !== null && (
                      <div
                        className="sp-chart-tip"
                        role="tooltip"
                        style={{ left: Math.max(48, 67 + hover * 52 - 107), top: 10 }}
                      >
                        <img src={assets.imgUnion} alt="" />
                        <span>
                          Expense<strong>{hover === 5 ? '$15.030' : 'Not provided'}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="sp-no-data" role="status">
                    No source data provided for {year}.
                    <button
                      onClick={() => {
                        setYear(2024);
                        setHover(5);
                      }}
                    >
                      Return to 2024
                    </button>
                  </div>
                )}
              </DashboardPanel>
              <DashboardPanel className="sp-totals">
                <div>
                  <Text variant="Semibold/Type@16">Total Income</Text>
                  <span className="sp-trend">
                    <Icon name="imgVuesaxLinearArrowUp" />
                  </span>
                  <p className="sp-total">
                    $50,530.00 <small>( USD )</small>
                  </p>
                  <p className="sp-comparison">
                    <b>20%</b> increase compared to last week
                  </p>
                </div>
                <img className="sp-total-divider" src={assets.imgVector10} alt="" />
                <div>
                  <Text variant="Semibold/Type@16">Total&nbsp; Expense</Text>
                  <span className="sp-trend">
                    <Icon name="imgVuesaxLinearArrowDown" />
                  </span>
                  <p className="sp-total">
                    $19,760.00 <small>( USD )</small>
                  </p>
                  <p className="sp-comparison expense">
                    <b>10%</b> decrease compared to last week
                  </p>
                </div>
              </DashboardPanel>
              <DashboardPanel className="sp-history" aria-label="Transaction History">
                <div className="sp-panel-heading">
                  <Text variant="Semibold/Type@16">Transaction History</Text>
                  <button className="sp-date" onClick={() => unsupported('Date range')}>
                    <Icon name="imgVuesaxLinearCalendar" />1 Jan - 1 Feb 2022
                  </button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Transactions</th>
                      {(['date', 'amount', 'status'] as const).map((field) => (
                        <th
                          key={field}
                          aria-sort={
                            sort.field === field
                              ? sort.descending
                                ? 'descending'
                                : 'ascending'
                              : 'none'
                          }
                        >
                          <button onClick={() => sortBy(field)}>
                            {field[0]!.toUpperCase() + field.slice(1)}
                            <Icon name="imgArrowDown1" />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <span className="sp-transaction-icon">
                            <img src={assets[row.icon]} alt="" />
                            {row.id === 1 && <Icon name="imgBank" />}
                          </span>
                          {row.name}
                        </td>
                        <td>{row.date}</td>
                        <td>$2,000.00</td>
                        <td>
                          <img className="sp-status-dot" src={assets[row.dot]} alt="" />
                          {row.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!rows.length && (
                  <p className="sp-empty" role="status">
                    No matching transactions.
                  </p>
                )}
              </DashboardPanel>
            </div>
            <div className="sp-side-column">
              <DashboardPanel className="sp-balance">
                <div className="sp-panel-heading">
                  <Text variant="Semibold/Type@16">Your balance</Text>
                  <button
                    aria-label="Balance options"
                    onClick={() => unsupported('Balance options')}
                  >
                    <Icon name="imgMore" />
                  </button>
                </div>
                <p className="sp-total">
                  $120,435.00 <small>( USD )</small>
                </p>
                <p className="sp-period">From Jan 01, 2022 to Jan 31, 2022</p>
                <div className="sp-balance-actions">
                  <DashboardAction onClick={() => unsupported('Top Up')}>
                    <Icon name="imgMoneyRecive" />
                    Top Up
                  </DashboardAction>
                  <DashboardAction outlined onClick={() => unsupported('Transfer')}>
                    <Icon name="imgMoneySend" />
                    Transfer
                  </DashboardAction>
                </div>
              </DashboardPanel>
              <DashboardPanel className="sp-categories">
                <div className="sp-panel-heading">
                  <Text variant="Semibold/Type@16">Spend by category</Text>
                  <button
                    aria-label="Category options"
                    onClick={() => unsupported('Category options')}
                  >
                    <Icon name="imgMore" />
                  </button>
                </div>
                <div className="sp-donut" tabIndex={0} aria-label="Overall Spending $19,760,00">
                  <img src={assets.imgGroup427320566} alt="Spending distribution by category" />
                  <div>
                    <span>{category === null ? 'Overall Spending' : categories[category]![0]}</span>
                    <strong>{category === null ? '$19,760,00' : categories[category]![1]}</strong>
                  </div>
                </div>
                <ul>
                  {categories.map(([name, value, color], index) => (
                    <li key={name}>
                      <button
                        onMouseEnter={() => setCategory(index)}
                        onMouseLeave={() => setCategory(null)}
                        onFocus={() => setCategory(index)}
                        onBlur={() => setCategory(null)}
                        onClick={() => setCategory(category === index ? null : index)}
                        aria-pressed={category === index}
                      >
                        <span className="sp-category-color" style={{ background: color }} />
                        <span>{name}</span>
                        <strong>{value}</strong>
                      </button>
                    </li>
                  ))}
                </ul>
              </DashboardPanel>
            </div>
          </main>
          {notice && (
            <div className="sp-notice" role="status">
              {notice}
              <button aria-label="Dismiss notice" onClick={() => setNotice('')}>
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </DesignSystemRoot>
  );
}
