"""Account selection service with various strategies."""
import random
from app import db
from models.account import Account


class AccountSelector:
    """Service for selecting accounts based on configured strategy."""
    
    # Track round-robin state per context
    _round_robin_indices = {}
    
    @classmethod
    def get_available_accounts(cls):
        """Get all available accounts that can be used."""
        accounts = Account.query.filter_by(status='active').all()
        return [acc for acc in accounts if acc.can_use()]
    
    @classmethod
    def select_account(cls, strategy='round_robin', context='default'):
        """Select an account based on strategy.
        
        Args:
            strategy: Selection strategy (round_robin, random, weighted)
            context: Context for round-robin tracking (e.g., 'reply', 'post')
            
        Returns:
            Account instance or None if no account available
        """
        available = cls.get_available_accounts()
        
        if not available:
            return None
        
        if strategy == 'random':
            return cls._select_random(available)
        elif strategy == 'weighted':
            return cls._select_weighted(available)
        else:  # default to round_robin
            return cls._select_round_robin(available, context)
    
    @classmethod
    def _select_round_robin(cls, accounts, context):
        """Select account using round-robin strategy."""
        if not accounts:
            return None
        
        # Get current index for this context
        current_index = cls._round_robin_indices.get(context, 0)
        
        # Ensure index is within bounds
        current_index = current_index % len(accounts)
        
        # Select account
        selected = accounts[current_index]
        
        # Update index for next call
        cls._round_robin_indices[context] = (current_index + 1) % len(accounts)
        
        return selected
    
    @classmethod
    def _select_random(cls, accounts):
        """Select account randomly."""
        if not accounts:
            return None
        return random.choice(accounts)
    
    @classmethod
    def _select_weighted(cls, accounts):
        """Select account based on weight."""
        if not accounts:
            return None
        
        # Build weighted list
        total_weight = sum(acc.weight for acc in accounts)
        if total_weight == 0:
            return random.choice(accounts)
        
        # Random selection based on weight
        pick = random.uniform(0, total_weight)
        current = 0
        
        for acc in accounts:
            current += acc.weight
            if current >= pick:
                return acc
        
        return accounts[-1]
    
    @classmethod
    def select_all_available(cls):
        """Get all available accounts for operations that need all accounts.
        
        This is used for reply operations where each account should reply once.
        """
        return cls.get_available_accounts()
