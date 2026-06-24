"use client";

import { useState, useEffect } from "react";
import { Project, FileEntry, createFile, renameFile, deleteFile } from "@/services/workspaceService";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { FileCode, Folder, FolderOpen, MoreVertical, Plus } from "lucide-react";

type TreeNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: Record<string, TreeNode>;
  childrenArray?: TreeNode[];
  file?: FileEntry;
};

function buildTree(files: FileEntry[]): TreeNode[] {
  const root: Record<string, TreeNode> = {};

  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevel = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = index === parts.length - 1;

      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : {},
        };
      }

      if (isFile) {
        currentLevel[part].file = file;
        currentLevel[part].type = "file";
      }

      if (!isFile) {
        currentLevel = currentLevel[part].children!;
      }
    });
  });

  function sortNodes(nodes: Record<string, TreeNode>): TreeNode[] {
    return Object.values(nodes)
      .filter(node => !(node.type === "file" && node.name === ".gitkeep")) // Hide .gitkeep files
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map(node => {
        if (node.children) {
          node.childrenArray = sortNodes(node.children);
        }
        return node;
      });
  }

  return sortNodes(root);
}

function Node({ node, level, project, userRole, onFileChange, onContextMenu }: { 
  node: TreeNode, 
  level: number, 
  project: Project,
  userRole: string,
  onFileChange: () => void,
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void
}) {
  const { openTab, activeTabId, expandedFolders, toggleFolder } = useWorkspaceStore();
  const isExpanded = expandedFolders.includes(node.path);

  const handleClick = () => {
    if (node.type === "folder") {
      toggleFolder(node.path);
    } else if (node.file) {
      openTab({
        id: node.file.id,
        projectId: project.id,
        path: node.file.path,
        language: node.file.language,
      });
    }
  };

  const isActive = node.file && activeTabId === node.file.id;

  return (
    <div>
      <div
        className={`flex items-center px-4 py-1 cursor-pointer text-sm transition-colors group ${
          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground hover:text-foreground'
        }`}
        style={{ paddingLeft: `${(level * 12) + 16}px` }}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
      >
        <span className="mr-2">
          {node.type === "folder" ? (
            isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />
          ) : (
            <FileCode size={14} />
          )}
        </span>
        <span className="truncate flex-1">{node.name}</span>
        
        {(userRole === "owner" || userRole === "editor") && (
          <button 
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded-sm hover:bg-muted-foreground/20 ml-2"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, node);
            }}
          >
            <MoreVertical size={14} />
          </button>
        )}
      </div>

      {node.type === "folder" && isExpanded && node.childrenArray && (
        <div>
          {node.childrenArray.length === 0 ? (
            <div 
              className="text-xs text-muted-foreground/50 italic py-1" 
              style={{ paddingLeft: `${((level + 1) * 12) + 16 + 22}px` }}
            >
              Empty
            </div>
          ) : (
            node.childrenArray.map((child) => (
              <Node 
                key={child.path} 
                node={child} 
                level={level + 1} 
                project={project} 
                userRole={userRole} 
                onFileChange={onFileChange}
                onContextMenu={onContextMenu}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function FileTree({ project, userRole, onFileChange }: { project: Project, userRole: string, onFileChange: () => void }) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: TreeNode | null;
  } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, node: TreeNode | null) => {
    e.preventDefault();
    if (userRole !== "owner" && userRole !== "editor") return;
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleCreateFile = async (basePath: string) => {
    const name = prompt("File name:");
    if (!name) return;
    const path = basePath ? `${basePath}/${name}` : name;
    try {
      await createFile(project.id, path);
      onFileChange();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateFolder = async (basePath: string) => {
    const name = prompt("Folder name:");
    if (!name) return;
    const path = basePath ? `${basePath}/${name}/.gitkeep` : `${name}/.gitkeep`;
    try {
      await createFile(project.id, path);
      onFileChange();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRename = async (node: TreeNode) => {
    const newName = prompt("New name:", node.name);
    if (!newName || newName === node.name) return;

    try {
      if (node.type === "file" && node.file) {
        const newPath = node.path.substring(0, node.path.lastIndexOf(node.name)) + newName;
        await renameFile(node.file.id, newPath);
      } else if (node.type === "folder") {
        const newPathBase = node.path.substring(0, node.path.lastIndexOf(node.name)) + newName;
        const filesToRename = project.files.filter(f => f.path.startsWith(node.path + "/"));
        await Promise.all(filesToRename.map(f => {
          const updatedPath = f.path.replace(node.path, newPathBase);
          return renameFile(f.id, updatedPath);
        }));
      }
      onFileChange();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (node: TreeNode) => {
    if (!confirm(`Are you sure you want to delete ${node.name}?`)) return;

    try {
      if (node.type === "file" && node.file) {
        await deleteFile(node.file.id);
      } else if (node.type === "folder") {
        const filesToDelete = project.files.filter(f => f.path.startsWith(node.path + "/"));
        await Promise.all(filesToDelete.map(f => deleteFile(f.id)));
      }
      onFileChange();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const tree = buildTree(project.files);

  return (
    <div className="relative h-full" onContextMenu={(e) => handleContextMenu(e, null)}>
      <div className="flex items-center justify-between px-4 py-1 group">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Explorer</span>
        {(userRole === "owner" || userRole === "editor") && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => handleCreateFile("")} className="text-muted-foreground hover:text-foreground" title="New File">
              <Plus size={14} />
            </button>
            <button onClick={() => handleCreateFolder("")} className="text-muted-foreground hover:text-foreground" title="New Folder">
              <Folder size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-1 pb-20">
        {tree.map(node => (
          <Node 
            key={node.path} 
            node={node} 
            level={0} 
            project={project} 
            userRole={userRole} 
            onFileChange={onFileChange} 
            onContextMenu={handleContextMenu}
          />
        ))}
        {tree.length === 0 && (
          <div className="px-4 py-4 text-sm text-muted-foreground italic text-center">
            Workspace is empty.
            <br/>Right-click to create a file or folder.
          </div>
        )}
      </div>

      {contextMenu && (
        <div 
          className="fixed z-50 bg-card border border-border shadow-lg rounded-md py-1 min-w-[150px] text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.node ? (
            <>
              {contextMenu.node.type === "folder" && (
                <>
                  <button className="w-full text-left px-4 py-1.5 hover:bg-muted" onClick={() => { handleCreateFile(contextMenu.node!.path); setContextMenu(null); }}>New File</button>
                  <button className="w-full text-left px-4 py-1.5 hover:bg-muted" onClick={() => { handleCreateFolder(contextMenu.node!.path); setContextMenu(null); }}>New Folder</button>
                  <div className="h-px bg-border my-1" />
                </>
              )}
              <button className="w-full text-left px-4 py-1.5 hover:bg-muted" onClick={() => { handleRename(contextMenu.node!); setContextMenu(null); }}>Rename</button>
              <button className="w-full text-left px-4 py-1.5 hover:bg-destructive hover:text-destructive-foreground text-red-500" onClick={() => { handleDelete(contextMenu.node!); setContextMenu(null); }}>Delete</button>
            </>
          ) : (
            <>
              <button className="w-full text-left px-4 py-1.5 hover:bg-muted" onClick={() => { handleCreateFile(""); setContextMenu(null); }}>New File</button>
              <button className="w-full text-left px-4 py-1.5 hover:bg-muted" onClick={() => { handleCreateFolder(""); setContextMenu(null); }}>New Folder</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
