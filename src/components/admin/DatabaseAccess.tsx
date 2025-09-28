"use client";

import { useState } from "react";

interface DatabaseAccessProps {
  isSuperAdmin: boolean;
  userEmail?: string;
}

export default function DatabaseAccess({ isSuperAdmin, userEmail }: DatabaseAccessProps) {
  const [isStudioRunning, setIsStudioRunning] = useState(false);

  const checkStudioStatus = async () => {
    try {
      const response = await fetch("http://localhost:5556", { 
        method: "HEAD",
        mode: "no-cors" 
      });
      setIsStudioRunning(true);
    } catch (error) {
      setIsStudioRunning(false);
    }
  };

  const openStudio = (path = "") => {
    window.open(`http://localhost:5556${path}`, "_blank", "noopener,noreferrer");
  };

  if (!isSuperAdmin || userEmail !== "infolegalge@gmail.com") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">Access Denied</span>
        </div>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
          Database access is restricted to super admin only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Check */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Prisma Studio Status</h3>
            <p className="text-sm text-muted-foreground">
              Check if the database studio is running
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={checkStudioStatus}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              Check Status
            </button>
            <div className={`h-2 w-2 rounded-full ${isStudioRunning ? "bg-green-500" : "bg-red-500"}`} />
          </div>
        </div>
      </div>

      {/* Quick Access Buttons */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => openStudio()}
          className="rounded-lg border bg-card p-4 text-left hover:bg-accent hover:text-accent-foreground"
        >
          <h4 className="font-medium">All Tables</h4>
          <p className="text-sm text-muted-foreground">View all database tables</p>
        </button>

        <button
          onClick={() => openStudio("/User")}
          className="rounded-lg border bg-card p-4 text-left hover:bg-accent hover:text-accent-foreground"
        >
          <h4 className="font-medium">Users</h4>
          <p className="text-sm text-muted-foreground">Manage user accounts</p>
        </button>

        <button
          onClick={() => openStudio("/PracticeArea")}
          className="rounded-lg border bg-card p-4 text-left hover:bg-accent hover:text-accent-foreground"
        >
          <h4 className="font-medium">Practice Areas</h4>
          <p className="text-sm text-muted-foreground">Edit practice areas</p>
        </button>

        <button
          onClick={() => openStudio("/Service")}
          className="rounded-lg border bg-card p-4 text-left hover:bg-accent hover:text-accent-foreground"
        >
          <h4 className="font-medium">Services</h4>
          <p className="text-sm text-muted-foreground">Edit services</p>
        </button>

        <button
          onClick={() => openStudio("/SpecialistProfile")}
          className="rounded-lg border bg-card p-4 text-left hover:bg-accent hover:text-accent-foreground"
        >
          <h4 className="font-medium">Specialists</h4>
          <p className="text-sm text-muted-foreground">Manage specialist profiles</p>
        </button>

        <button
          onClick={() => openStudio("/Post")}
          className="rounded-lg border bg-card p-4 text-left hover:bg-accent hover:text-accent-foreground"
        >
          <h4 className="font-medium">Posts</h4>
          <p className="text-sm text-muted-foreground">Manage blog posts</p>
        </button>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="mb-2 font-medium">Instructions</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Click any button above to open the corresponding table in Prisma Studio</li>
          <li>• Use the studio interface to view, edit, add, or delete records</li>
          <li>• Changes are saved automatically in the studio</li>
          <li>• Be careful when modifying data as changes are immediate</li>
        </ul>
      </div>
    </div>
  );
}
