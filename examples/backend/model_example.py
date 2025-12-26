"""
Example SQLAlchemy Model Pattern

This file demonstrates the standard pattern for creating database models
in the Call Analyzer application.

Usage:
- Copy this template when creating new models
- Modify table name, columns, and relationships as needed
- Always include to_dict() method for API responses
"""

from app import db
from datetime import datetime


class ExampleEntity(db.Model):
    """
    Example entity model showing standard patterns.

    This model demonstrates:
    - Table definition
    - Column types and constraints
    - Relationships
    - Helper methods
    """

    __tablename__ = 'example_entities'

    # Primary Key
    id = db.Column(db.Integer, primary_key=True)

    # String Columns
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)

    # Numeric Columns
    count = db.Column(db.Integer, default=0)
    price = db.Column(db.Numeric(10, 2), nullable=True)

    # Boolean Columns
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)

    # JSON Columns (for flexible data)
    metadata = db.Column(db.JSON, nullable=True)
    settings = db.Column(db.JSON, nullable=True)

    # Enum Columns
    status = db.Column(
        db.Enum('pending', 'active', 'archived', name='entity_status'),
        default='pending'
    )

    # Foreign Keys
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    team_id = db.Column(
        db.Integer,
        db.ForeignKey('teams.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    # Many-to-One (this entity belongs to user)
    user = db.relationship('User', backref='example_entities', lazy=True)
    team = db.relationship('Team', backref='example_entities', lazy=True)

    # One-to-Many (this entity has many children)
    children = db.relationship(
        'ChildEntity',
        backref='parent',
        lazy=True,
        cascade='all, delete-orphan'  # Delete children when parent deleted
    )

    # Indexes (for frequently queried combinations)
    __table_args__ = (
        db.Index('idx_user_team', 'user_id', 'team_id'),
        db.Index('idx_status_active', 'status', 'is_active'),
    )

    def __repr__(self):
        """String representation for debugging"""
        return f'<ExampleEntity {self.id}: {self.name}>'

    def to_dict(self, include_children=False):
        """
        Convert model to dictionary for API responses.

        Args:
            include_children (bool): Whether to include related children

        Returns:
            dict: Dictionary representation of the entity
        """
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'email': self.email,
            'count': self.count,
            'price': float(self.price) if self.price else None,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'metadata': self.metadata,
            'settings': self.settings,
            'status': self.status,
            'user_id': self.user_id,
            'team_id': self.team_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        # Optionally include related data
        if include_children and self.children:
            data['children'] = [child.to_dict() for child in self.children]

        return data

    def update_from_dict(self, data):
        """
        Update model fields from dictionary.

        Args:
            data (dict): Dictionary with fields to update

        Note:
            Only updates fields that are present in the dictionary
            and are allowed to be updated.
        """
        # Define updatable fields
        updatable_fields = [
            'name', 'description', 'count', 'price',
            'is_active', 'is_verified', 'metadata',
            'settings', 'status'
        ]

        for field in updatable_fields:
            if field in data:
                setattr(self, field, data[field])

    @classmethod
    def get_by_id(cls, entity_id, user_id=None):
        """
        Get entity by ID with optional user filtering.

        Args:
            entity_id (int): Entity ID
            user_id (int, optional): User ID for access control

        Returns:
            ExampleEntity or None
        """
        query = cls.query.filter_by(id=entity_id)

        if user_id:
            query = query.filter_by(user_id=user_id)

        return query.first()

    @classmethod
    def get_all(cls, user_id=None, team_id=None, filters=None, page=1, limit=20):
        """
        Get all entities with filtering and pagination.

        Args:
            user_id (int, optional): Filter by user
            team_id (int, optional): Filter by team
            filters (dict, optional): Additional filters
            page (int): Page number (1-indexed)
            limit (int): Items per page

        Returns:
            tuple: (entities list, total count)
        """
        query = cls.query

        # Apply filters
        if user_id:
            query = query.filter_by(user_id=user_id)
        if team_id:
            query = query.filter_by(team_id=team_id)

        # Apply additional filters from dict
        if filters:
            if 'status' in filters:
                query = query.filter_by(status=filters['status'])
            if 'is_active' in filters:
                query = query.filter_by(is_active=filters['is_active'])
            if 'search' in filters and filters['search']:
                search_term = f"%{filters['search']}%"
                query = query.filter(
                    db.or_(
                        cls.name.ilike(search_term),
                        cls.description.ilike(search_term)
                    )
                )

        # Get total count before pagination
        total = query.count()

        # Apply pagination
        entities = query.order_by(cls.created_at.desc()) \
                       .limit(limit) \
                       .offset((page - 1) * limit) \
                       .all()

        return entities, total

    def can_be_modified_by(self, user):
        """
        Check if user has permission to modify this entity.

        Args:
            user (User): User object

        Returns:
            bool: True if user can modify
        """
        # Owner can modify
        if self.user_id == user.id:
            return True

        # Team members can modify if they're on the same team
        # (implement based on your business logic)
        return False

    def soft_delete(self):
        """
        Soft delete by marking as inactive instead of removing from database.
        """
        self.is_active = False
        self.updated_at = datetime.utcnow()


# Example of related child model
class ChildEntity(db.Model):
    """Example child entity with foreign key to parent"""

    __tablename__ = 'child_entities'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)

    # Foreign key to parent
    parent_id = db.Column(
        db.Integer,
        db.ForeignKey('example_entities.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'parent_id': self.parent_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# Usage Examples:
"""
# Creating a new entity
entity = ExampleEntity(
    name='Example',
    description='This is an example',
    email='example@test.com',
    user_id=1,
    team_id=1
)
db.session.add(entity)
db.session.commit()

# Querying
entity = ExampleEntity.get_by_id(1, user_id=1)
entities, total = ExampleEntity.get_all(team_id=1, page=1, limit=20)

# Updating
entity.update_from_dict({'name': 'New Name', 'count': 5})
db.session.commit()

# Converting to dict for API response
data = entity.to_dict(include_children=True)

# Soft deleting
entity.soft_delete()
db.session.commit()

# Hard deleting
db.session.delete(entity)
db.session.commit()
"""
