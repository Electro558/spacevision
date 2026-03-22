'use client';

interface ToolCallChipProps {
  tool: string;
  input: Record<string, unknown>;
}

export default function ToolCallChip({ tool, input }: ToolCallChipProps) {
  const name = (input.name as string) || (input.names as string[])?.join(', ') || '';

  switch (tool) {
    case 'add_object': {
      const type = input.type as string;
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-medium my-0.5">
          <span>+</span>
          <span>Added &quot;{name}&quot; ({type})</span>
        </div>
      );
    }
    case 'modify_object': {
      const changes = Object.keys(input).filter(k => k !== 'name' && k !== 'new_name');
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-[10px] font-medium my-0.5">
          <span>~</span>
          <span>Modified &quot;{name}&quot; &rarr; {changes.join(', ')}</span>
        </div>
      );
    }
    case 'delete_object':
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-medium my-0.5">
          <span>&times;</span>
          <span>Deleted &quot;{name}&quot;</span>
        </div>
      );
    case 'select_objects': {
      const names = input.names as string[];
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-medium my-0.5">
          <span>&#9673;</span>
          <span>Selected {names?.join(', ')}</span>
        </div>
      );
    }
    default:
      return null;
  }
}
