export default function ChecklistLoading() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 overflow-hidden bg-primary/10">
      <div className="loading-bar-fill h-full w-1/3 rounded-full bg-primary" />
    </div>
  );
}
