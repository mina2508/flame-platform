// Central role & permission definitions for the FLAME platform.
//
// Roles:
//   admin         - full access; the ONLY role that can add/manage users
//   content_editor- edit content (schools, people, news, activities, curriculum)
//   reviewer      - review (view) submitted applications only
//   form_manager  - edit the application form fields only
//
// Each route uses requireRole(...) with the roles allowed for that action.

export const ROLES = ['admin', 'content_editor', 'reviewer', 'form_manager'];

export const ROLE_DESCRIPTIONS = {
  admin: 'Full access to everything. The only role that can create and manage users.',
  content_editor: 'Can edit content: schools, people, news, activities, and curriculum.',
  reviewer: 'Can review (view) submitted applications only.',
  form_manager: 'Can edit the application form fields only.',
};

// Who can edit content sections
export const CAN_EDIT_CONTENT = ['admin', 'content_editor'];
// Who can view/manage applications
export const CAN_REVIEW_APPLICATIONS = ['admin', 'reviewer'];
// Who can manage the application form fields
export const CAN_MANAGE_FORM = ['admin', 'form_manager'];
// Who can manage users
export const CAN_MANAGE_USERS = ['admin'];
