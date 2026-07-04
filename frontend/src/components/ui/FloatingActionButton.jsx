import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FloatingActionButton.css';

/**
 * FloatingActionButton - FAB para acciones rápidas
 * Botón flotante para agregar gastos rápidamente
 */
function FloatingActionButton({ onClick, icon = '➕', label = 'Agregar', position = 'bottom-right' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPulsing, setIsPulsing] = useState(true);

  const handleClick = () => {
    setIsExpanded(false);
    setIsPulsing(false);
    if (onClick) onClick();
  };

  // Stop pulsing after first interaction
  const handleInteraction = () => {
    setIsPulsing(false);
  };

  const positionClasses = {
    'bottom-right': 'fab-bottom-right',
    'bottom-left': 'fab-bottom-left',
    'top-right': 'fab-top-right',
    'top-left': 'fab-top-left',
  };

  return (
    <>
      <button
        className={`fab ${positionClasses[position]} ${isExpanded ? 'fab-expanded' : ''} ${isPulsing ? 'fab-pulsing' : ''}`}
        onClick={handleClick}
        onMouseEnter={handleInteraction}
        aria-label={label}
        title={label}
      >
        <span className="fab-icon" aria-hidden="true">{icon}</span>
        <span className="fab-label">{label}</span>
        <span className="fab-ripple"></span>
      </button>
    </>
  );
}

/**
 * ExpenseFAB - FAB específico para agregar gastos
 */
function ExpenseFAB() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/expenses');
    // Scroll to top and focus on form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <FloatingActionButton
      onClick={handleClick}
      icon="💸"
      label="Gasto"
      position="bottom-right"
    />
  );
}

/**
 * QuickActionsFAB - FAB con acciones múltiples
 */
function QuickActionsFAB({ actions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const defaultActions = [
    { icon: '💸', label: 'Gasto', onClick: () => navigate('/expenses') },
    { icon: '🎯', label: 'Presupuesto', onClick: () => navigate('/budgets') },
    { icon: '📊', label: 'Ver Dashboard', onClick: () => navigate('/dashboard') },
  ];

  const actionsList = actions.length > 0 ? actions : defaultActions;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="quick-actions-fab-container">
      {/* Action Items */}
      {actionsList.map((action, index) => (
        <button
          key={index}
          className={`quick-action-item ${isOpen ? 'quick-action-item-visible' : ''}`}
          onClick={() => {
            action.onClick();
            setIsOpen(false);
          }}
          style={{ animationDelay: `${index * 0.05}s` }}
          aria-label={action.label}
        >
          <span className="quick-action-icon">{action.icon}</span>
          <span className="quick-action-label">{action.label}</span>
        </button>
      ))}

      {/* Main FAB */}
      <button
        className={`fab quick-actions-fab ${isOpen ? 'quick-actions-fab-open' : ''}`}
        onClick={toggleOpen}
        aria-label="Acciones rápidas"
        aria-expanded={isOpen}
      >
        <span className="fab-icon quick-actions-fab-icon">
          {isOpen ? '✕' : '⚡'}
        </span>
        <span className="fab-label">Acciones</span>
      </button>
    </div>
  );
}

/**
 * BudgetAlertFAB - FAB para alertas de presupuesto
 */
function BudgetAlertFAB({ onClick, overBudget = false }) {
  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <FloatingActionButton
      onClick={handleClick}
      icon={overBudget ? '⚠️' : '💰'}
      label={overBudget ? '¡Excedido!' : 'Presupuesto'}
      position="bottom-left"
    />
  );
}

export {
  FloatingActionButton,
  ExpenseFAB,
  QuickActionsFAB,
  BudgetAlertFAB,
};
