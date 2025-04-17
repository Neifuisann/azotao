import { useState, useRef } from "react";
import { Content, Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CreateTestPage() {
  const [testTitle, setTestTitle] = useState("");
  const [editorContent, setEditorContent] = useState<Content>("");
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate saving content
    setTimeout(() => {
      setIsSaving(false);
      // Navigate to configuration page
      navigate("/testbank/configuration");
    }, 1000);
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-900 flex flex-col testbank-create">
      {/* Fixed Header */}
      <header className="border-b shadow-sm px-6 py-3 bg-white dark:bg-zinc-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4 flex-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 bg-black text-white hover:bg-gray-800 hover:text-white dark:bg-zinc-700"
            onClick={() => navigate("/testbank")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="w-80">
            <Input
              id="test-title"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Enter test title..."
              className="h-9 border bg-gray-50 dark:bg-zinc-700 text-gray-900 dark:text-white focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            size="sm"
            className="gap-1 bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={!testTitle || isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Continue
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Pane */}
        <div className="w-1/2 p-0 overflow-hidden flex flex-col bg-gray-50 dark:bg-zinc-800">
          <div className="p-3 border-b font-medium text-sm text-gray-700 bg-gray-100 dark:bg-zinc-700 dark:text-white">Preview</div>
          <div className="flex-1 overflow-auto p-5">
            <div className="prose prose-gray dark:prose-invert prose-img:rounded max-w-none text-white preview-content">
              {editorContent ? (
                typeof editorContent === "string" ? (
                  <div className="text-white" dangerouslySetInnerHTML={{ __html: editorContent }} />
                ) : (
                  <div className="text-white">Content will appear here</div>
                )
              ) : (
                <div className="text-gray-300 italic">
                  Your formatted test content will appear here as you type...
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Editor Pane */}
        <div className="w-1/2 border-l overflow-hidden flex flex-col bg-white dark:bg-zinc-900">
          <div className="p-3 border-b font-medium text-sm text-gray-700 dark:text-white bg-gray-100 dark:bg-zinc-700">Editor</div>
          <div className="flex-1 p-0 overflow-hidden">

          </div>
        </div>
      </div>
    </div>
  );
}
