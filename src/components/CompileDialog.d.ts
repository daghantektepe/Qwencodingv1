import React from 'react';

export interface CompileDialogProps {
  open: boolean;
  onClose: () => void;
  tree?: any;
  projectId?: string;
  projectName?: string;
  onCompile?: (options: any) => void | Promise<any>;
  [key: string]: any;
}

declare const CompileDialog: React.FC<CompileDialogProps>;
export default CompileDialog;
