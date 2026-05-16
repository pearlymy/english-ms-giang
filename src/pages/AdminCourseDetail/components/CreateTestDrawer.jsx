/**
 * CreateTestDrawer.jsx
 * Thin wrapper around CreateAssignmentDrawer with isTest=true.
 * All logic, bug fixes, and UI changes are handled in CreateAssignmentDrawer.
 */
import { CreateAssignmentDrawer } from './CreateAssignmentDrawer';

export const CreateTestDrawer = ({ open, unitName, onClose, onSave }) => (
  <CreateAssignmentDrawer
    open={open}
    unitName={unitName}
    onClose={onClose}
    onSave={onSave}
    isTest={true}
  />
);

export default CreateTestDrawer;
