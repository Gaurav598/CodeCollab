import {
  FileCode, FileJson, FileType, FileText,
  Braces, TerminalSquare, Image as ImageIcon,
  MoreVertical, Plus, Hexagon, Hash
} from "lucide-react";

export function FileIcon({ name, size = 15, className = "" }: { name: string; size?: number; className?: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  
  let Icon = FileText;
  let colorClass = "text-slate-400";

  switch (ext) {
    case 'js':
    case 'jsx':
      Icon = FileCode;
      colorClass = "text-yellow-400";
      break;
    case 'ts':
    case 'tsx':
      Icon = FileType;
      colorClass = "text-blue-400";
      break;
    case 'json':
      Icon = Braces;
      colorClass = "text-green-400";
      break;
    case 'py':
      Icon = FileCode;
      colorClass = "text-blue-500";
      break;
    case 'cpp':
    case 'c':
    case 'cc':
    case 'h':
    case 'hpp':
      Icon = FileCode;
      colorClass = "text-purple-400";
      break;
    case 'html':
      Icon = FileCode;
      colorClass = "text-orange-400";
      break;
    case 'css':
      Icon = Hash;
      colorClass = "text-blue-300";
      break;
    case 'md':
      Icon = FileText;
      colorClass = "text-slate-400";
      break;
    case 'sh':
    case 'bash':
      Icon = TerminalSquare;
      colorClass = "text-green-500";
      break;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      Icon = ImageIcon;
      colorClass = "text-pink-400";
      break;
    case 'java':
      Icon = FileCode;
      colorClass = "text-orange-500";
      break;
    case 'go':
      Icon = FileCode;
      colorClass = "text-cyan-400";
      break;
    case 'rs':
      Icon = Hexagon;
      colorClass = "text-orange-600";
      break;
    default:
      Icon = FileCode;
      colorClass = "text-purple-400";
      break;
  }

  return <Icon size={size} className={`${colorClass} ${className}`} />;
}
