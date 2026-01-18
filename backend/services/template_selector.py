"""Reply template selection service."""
import random
from models.reply_template import ReplyTemplate


class TemplateSelector:
    """Service for selecting reply templates based on configured strategy."""
    
    # Track round-robin state per target
    _round_robin_indices = {}
    
    @classmethod
    def get_available_templates(cls, target_id=None):
        """Get all available templates, optionally filtered by target.
        
        Args:
            target_id: Optional target ID to filter templates for
            
        Returns:
            List of active templates
        """
        query = ReplyTemplate.query.filter_by(status='active')
        
        if target_id:
            # Get templates for this target or global templates
            query = query.filter(
                (ReplyTemplate.scope == 'global') | 
                (ReplyTemplate.target_id == target_id)
            )
        else:
            # Only global templates
            query = query.filter_by(scope='global')
        
        return query.order_by(ReplyTemplate.sort_order, ReplyTemplate.id).all()
    
    @classmethod
    def select_template(cls, strategy='round_robin', target_id=None):
        """Select a template based on strategy.
        
        Args:
            strategy: Selection strategy (round_robin, random)
            target_id: Optional target ID for context
            
        Returns:
            ReplyTemplate instance or None if none available
        """
        templates = cls.get_available_templates(target_id)
        
        if not templates:
            return None
        
        if strategy == 'random':
            return cls._select_random(templates)
        else:  # default to round_robin
            return cls._select_round_robin(templates, target_id)
    
    @classmethod
    def _select_round_robin(cls, templates, target_id):
        """Select template using round-robin strategy."""
        if not templates:
            return None
        
        # Use target_id as context key
        context = f"target_{target_id}" if target_id else "global"
        
        # Get current index for this context
        current_index = cls._round_robin_indices.get(context, 0)
        
        # Ensure index is within bounds
        current_index = current_index % len(templates)
        
        # Select template
        selected = templates[current_index]
        
        # Update index for next call
        cls._round_robin_indices[context] = (current_index + 1) % len(templates)
        
        return selected
    
    @classmethod
    def _select_random(cls, templates):
        """Select template randomly."""
        if not templates:
            return None
        return random.choice(templates)
