import { FieldForm } from "./form";
import { DesktopGuard } from "./desktop-guard";

export default function FieldPage() {
  return (
    <>
      <DesktopGuard />
      {/* Form some em md+ via parent class — DesktopGuard cobre 100% em desktop */}
      <div className="md:hidden">
        <FieldForm />
      </div>
    </>
  );
}
