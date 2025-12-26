"""
Example Service Layer Pattern

This file demonstrates the standard pattern for implementing business logic
in service classes.

Key Principles:
- Services contain business logic, not routes
- Services are stateless (use @staticmethod)
- Services handle errors and return clean data
- Services orchestrate between models and external APIs
"""

from app import db
from app.models.example import ExampleEntity
from datetime import datetime


class ExampleService:
    """
    Service class for ExampleEntity business logic.

    Services handle:
    - Complex business logic
    - Data validation
    - Orchestration between models
    - External API calls
    - Error handling
    """

    @staticmethod
    def create_entity(user_id, team_id, data):
        """
        Create a new entity with validation.

        Args:
            user_id (int): ID of the user creating the entity
            team_id (int): ID of the team
            data (dict): Entity data

        Returns:
            dict: Created entity as dictionary

        Raises:
            ValueError: If validation fails
        """
        # Validate required fields
        required_fields = ['name', 'email']
        for field in required_fields:
            if not data.get(field):
                raise ValueError(f"{field} is required")

        # Business logic validation
        if len(data['name']) < 3:
            raise ValueError("Name must be at least 3 characters")

        # Check for duplicates
        existing = ExampleEntity.query.filter_by(
            email=data['email'],
            team_id=team_id
        ).first()

        if existing:
            raise ValueError("Entity with this email already exists in team")

        # Create entity
        entity = ExampleEntity(
            name=data['name'],
            description=data.get('description', ''),
            email=data['email'],
            count=data.get('count', 0),
            price=data.get('price'),
            metadata=data.get('metadata'),
            settings=data.get('settings'),
            user_id=user_id,
            team_id=team_id
        )

        try:
            db.session.add(entity)
            db.session.commit()

            return entity.to_dict()

        except Exception as e:
            db.session.rollback()
            raise ValueError(f"Failed to create entity: {str(e)}")

    @staticmethod
    def get_entity(entity_id, user_id=None, team_id=None):
        """
        Get a single entity with access control.

        Args:
            entity_id (int): Entity ID
            user_id (int, optional): User ID for access control
            team_id (int, optional): Team ID for access control

        Returns:
            dict: Entity data or None if not found/no access

        Raises:
            ValueError: If entity not found or access denied
        """
        entity = ExampleEntity.query.get(entity_id)

        if not entity:
            raise ValueError("Entity not found")

        # Access control: user must be in same team
        if team_id and entity.team_id != team_id:
            raise ValueError("Access denied")

        return entity.to_dict(include_children=True)

    @staticmethod
    def get_all_entities(user_id, team_id, filters=None, page=1, limit=20):
        """
        Get all entities for a team with filtering and pagination.

        Args:
            user_id (int): User ID requesting the data
            team_id (int): Team ID to filter by
            filters (dict, optional): Additional filters
            page (int): Page number
            limit (int): Items per page

        Returns:
            dict: Paginated results with metadata
        """
        # Get entities using model class method
        entities, total = ExampleEntity.get_all(
            team_id=team_id,
            filters=filters,
            page=page,
            limit=limit
        )

        # Calculate pagination metadata
        total_pages = (total + limit - 1) // limit

        return {
            'entities': [e.to_dict() for e in entities],
            'total': total,
            'page': page,
            'pages': total_pages,
            'limit': limit
        }

    @staticmethod
    def update_entity(entity_id, user_id, team_id, data):
        """
        Update an entity with validation and access control.

        Args:
            entity_id (int): Entity ID
            user_id (int): User ID making the update
            team_id (int): Team ID for access control
            data (dict): Update data

        Returns:
            dict: Updated entity

        Raises:
            ValueError: If validation fails or access denied
        """
        # Get entity
        entity = ExampleEntity.query.get(entity_id)

        if not entity:
            raise ValueError("Entity not found")

        # Access control
        if entity.team_id != team_id:
            raise ValueError("Access denied")

        # Validate updates
        if 'name' in data and len(data['name']) < 3:
            raise ValueError("Name must be at least 3 characters")

        # Check email uniqueness if email is being changed
        if 'email' in data and data['email'] != entity.email:
            existing = ExampleEntity.query.filter_by(
                email=data['email'],
                team_id=team_id
            ).first()

            if existing:
                raise ValueError("Email already in use")

        # Apply updates
        try:
            entity.update_from_dict(data)
            db.session.commit()

            return entity.to_dict()

        except Exception as e:
            db.session.rollback()
            raise ValueError(f"Failed to update entity: {str(e)}")

    @staticmethod
    def delete_entity(entity_id, user_id, team_id, soft_delete=True):
        """
        Delete an entity (soft or hard delete).

        Args:
            entity_id (int): Entity ID
            user_id (int): User ID requesting deletion
            team_id (int): Team ID for access control
            soft_delete (bool): Whether to soft delete (default) or hard delete

        Raises:
            ValueError: If entity not found or access denied
        """
        entity = ExampleEntity.query.get(entity_id)

        if not entity:
            raise ValueError("Entity not found")

        # Access control
        if entity.team_id != team_id:
            raise ValueError("Access denied")

        try:
            if soft_delete:
                # Soft delete: just mark as inactive
                entity.soft_delete()
                db.session.commit()
            else:
                # Hard delete: remove from database
                db.session.delete(entity)
                db.session.commit()

        except Exception as e:
            db.session.rollback()
            raise ValueError(f"Failed to delete entity: {str(e)}")

    @staticmethod
    def bulk_create(user_id, team_id, entities_data):
        """
        Create multiple entities in a transaction.

        Args:
            user_id (int): User ID
            team_id (int): Team ID
            entities_data (list): List of entity data dicts

        Returns:
            dict: Summary of created entities

        Raises:
            ValueError: If any validation fails (rolls back all)
        """
        created_entities = []

        try:
            for data in entities_data:
                # Validate each entity
                required_fields = ['name', 'email']
                for field in required_fields:
                    if not data.get(field):
                        raise ValueError(f"{field} is required")

                # Create entity
                entity = ExampleEntity(
                    name=data['name'],
                    email=data['email'],
                    description=data.get('description', ''),
                    user_id=user_id,
                    team_id=team_id
                )

                db.session.add(entity)
                created_entities.append(entity)

            # Commit all at once
            db.session.commit()

            return {
                'created': len(created_entities),
                'entities': [e.to_dict() for e in created_entities]
            }

        except Exception as e:
            db.session.rollback()
            raise ValueError(f"Bulk create failed: {str(e)}")

    @staticmethod
    def get_statistics(team_id):
        """
        Get statistics for entities in a team.

        Args:
            team_id (int): Team ID

        Returns:
            dict: Statistics data
        """
        from sqlalchemy import func

        # Count by status
        status_counts = db.session.query(
            ExampleEntity.status,
            func.count(ExampleEntity.id).label('count')
        ).filter_by(
            team_id=team_id
        ).group_by(
            ExampleEntity.status
        ).all()

        # Total count
        total = ExampleEntity.query.filter_by(team_id=team_id).count()

        # Active count
        active = ExampleEntity.query.filter_by(
            team_id=team_id,
            is_active=True
        ).count()

        return {
            'total': total,
            'active': active,
            'inactive': total - active,
            'by_status': {status: count for status, count in status_counts}
        }

    @staticmethod
    def search(team_id, query, limit=10):
        """
        Search entities by name or description.

        Args:
            team_id (int): Team ID
            query (str): Search query
            limit (int): Max results

        Returns:
            list: Matching entities
        """
        search_term = f"%{query}%"

        entities = ExampleEntity.query.filter(
            ExampleEntity.team_id == team_id,
            db.or_(
                ExampleEntity.name.ilike(search_term),
                ExampleEntity.description.ilike(search_term),
                ExampleEntity.email.ilike(search_term)
            )
        ).limit(limit).all()

        return [e.to_dict() for e in entities]

    @staticmethod
    def duplicate_entity(entity_id, user_id, team_id, new_name=None):
        """
        Duplicate an existing entity.

        Args:
            entity_id (int): Entity ID to duplicate
            user_id (int): User ID
            team_id (int): Team ID
            new_name (str, optional): Name for duplicated entity

        Returns:
            dict: Duplicated entity

        Raises:
            ValueError: If original entity not found
        """
        # Get original entity
        original = ExampleEntity.query.get(entity_id)

        if not original:
            raise ValueError("Entity not found")

        if original.team_id != team_id:
            raise ValueError("Access denied")

        # Create duplicate
        duplicate = ExampleEntity(
            name=new_name or f"{original.name} (Copy)",
            description=original.description,
            email=f"copy_{original.email}",  # Make unique
            count=original.count,
            price=original.price,
            metadata=original.metadata,
            settings=original.settings,
            status=original.status,
            user_id=user_id,
            team_id=team_id
        )

        try:
            db.session.add(duplicate)
            db.session.commit()

            return duplicate.to_dict()

        except Exception as e:
            db.session.rollback()
            raise ValueError(f"Failed to duplicate entity: {str(e)}")


# Usage Examples:
"""
# Create entity
try:
    entity = ExampleService.create_entity(
        user_id=1,
        team_id=1,
        data={'name': 'Test', 'email': 'test@example.com'}
    )
    print(f"Created: {entity}")
except ValueError as e:
    print(f"Error: {e}")

# Get entity
try:
    entity = ExampleService.get_entity(
        entity_id=1,
        team_id=1
    )
    print(f"Found: {entity}")
except ValueError as e:
    print(f"Error: {e}")

# Get all entities with pagination
results = ExampleService.get_all_entities(
    user_id=1,
    team_id=1,
    filters={'status': 'active', 'search': 'test'},
    page=1,
    limit=20
)
print(f"Found {results['total']} entities")

# Update entity
try:
    entity = ExampleService.update_entity(
        entity_id=1,
        user_id=1,
        team_id=1,
        data={'name': 'Updated Name'}
    )
    print(f"Updated: {entity}")
except ValueError as e:
    print(f"Error: {e}")

# Delete entity
try:
    ExampleService.delete_entity(
        entity_id=1,
        user_id=1,
        team_id=1,
        soft_delete=True
    )
    print("Deleted successfully")
except ValueError as e:
    print(f"Error: {e}")

# Get statistics
stats = ExampleService.get_statistics(team_id=1)
print(f"Statistics: {stats}")

# Search
results = ExampleService.search(team_id=1, query='test')
print(f"Search results: {results}")
"""
