import logoIcon from '../assets/icons/logo.svg';
import userIcon from '../assets/icons/user.svg';
import '../css/components/Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <img src={logoIcon} alt="Learning Map" className="header-logo" />
          <div className="header-text">
            <h1 className="header-title">Learning Map</h1>
            <p className="header-subtitle">Track your knowledge journey</p>
          </div>
        </div>
        <button className="header-mode-btn">
          <img src={userIcon} alt="" className="header-mode-icon" />
          <span>Owner Mode</span>
        </button>
      </div>
    </header>
  );
}
