/**
 * Example React Component Pattern
 *
 * This file demonstrates the standard pattern for creating React components
 * in the Call Analyzer application.
 *
 * Key Principles:
 * - Functional components with TypeScript
 * - Hooks for state and effects
 * - Props interfaces for type safety
 * - Loading and error states
 * - Tailwind CSS for styling
 * - Toast notifications for user feedback
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

// Types
interface Entity {
  id: number;
  name: string;
  description: string;
  email: string;
  status: 'pending' | 'active' | 'archived';
  created_at: string;
}

interface EntityListProps {
  teamId: number;
  onEntityClick?: (entity: Entity) => void;
  showActions?: boolean;
}

/**
 * EntityList Component
 *
 * Displays a list of entities with CRUD operations.
 * Demonstrates:
 * - Data fetching with useEffect
 * - Loading and error states
 * - Search functionality
 * - Pagination
 * - CRUD operations with confirmation
 */
export const EntityList: React.FC<EntityListProps> = ({
  teamId,
  onEntityClick,
  showActions = true,
}) => {
  // State
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load entities on mount and when dependencies change
  useEffect(() => {
    loadEntities();
  }, [teamId, page, searchQuery]);

  /**
   * Load entities from API
   */
  const loadEntities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Import service (assuming it exists)
      // const response = await entityService.getAll(teamId, page, 20, searchQuery);

      // Simulated API response for example
      const response = {
        entities: [
          {
            id: 1,
            name: 'Example Entity',
            description: 'This is an example',
            email: 'example@test.com',
            status: 'active' as const,
            created_at: new Date().toISOString(),
          },
        ],
        total: 1,
        pages: 1,
      };

      setEntities(response.entities);
      setTotalPages(response.pages);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load entities';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle entity deletion with confirmation
   */
  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      // await entityService.delete(id);
      toast.success('Entity deleted successfully');
      loadEntities(); // Reload list
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete entity');
    }
  };

  /**
   * Handle search with debouncing (implement useDebounce hook separately)
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  };

  /**
   * Loading State
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading entities...</span>
      </div>
    );
  }

  /**
   * Error State
   */
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadEntities}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  /**
   * Empty State
   */
  if (entities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Search className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No entities found
        </h3>
        <p className="text-gray-500 mb-4">
          {searchQuery
            ? 'Try adjusting your search criteria'
            : 'Get started by creating your first entity'}
        </p>
        {!searchQuery && (
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Create Entity
          </button>
        )}
      </div>
    );
  }

  /**
   * Main Render
   */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Entities</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Entity
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search entities..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Entity List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entities.map((entity) => (
          <div
            key={entity.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onEntityClick?.(entity)}
          >
            {/* Status Badge */}
            <div className="flex justify-between items-start mb-3">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  entity.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : entity.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {entity.status}
              </span>

              {/* Actions */}
              {showActions && (
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle edit
                      toast.info('Edit functionality');
                    }}
                    className="text-gray-500 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entity.id, entity.name);
                    }}
                    className="text-gray-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Entity Info */}
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {entity.name}
            </h3>
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {entity.description || 'No description'}
            </p>
            <p className="text-sm text-gray-500">{entity.email}</p>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                Created {new Date(entity.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-gray-600">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Usage Example:
 *
 * import { EntityList } from './components/EntityList';
 *
 * function Page() {
 *   const handleEntityClick = (entity) => {
 *     console.log('Clicked:', entity);
 *     // Navigate to detail page or open modal
 *   };
 *
 *   return (
 *     <div className="container mx-auto p-6">
 *       <EntityList
 *         teamId={1}
 *         onEntityClick={handleEntityClick}
 *         showActions={true}
 *       />
 *     </div>
 *   );
 * }
 */

/**
 * Common Component Patterns:
 *
 * 1. Loading State:
 *    - Show spinner or skeleton
 *    - Disable interactions
 *    - Clear, centered presentation
 *
 * 2. Error State:
 *    - Show error message
 *    - Provide retry button
 *    - Use appropriate styling (red)
 *
 * 3. Empty State:
 *    - Show helpful message
 *    - Provide action button
 *    - Use icon or illustration
 *
 * 4. Confirmation Dialogs:
 *    - Use window.confirm for simple cases
 *    - Use custom modal for complex cases
 *    - Always confirm destructive actions
 *
 * 5. Toast Notifications:
 *    - Success: green, short message
 *    - Error: red, descriptive message
 *    - Info: blue, helpful message
 *
 * 6. Accessibility:
 *    - Use semantic HTML
 *    - Add aria labels
 *    - Keyboard navigation
 *    - Focus management
 */
