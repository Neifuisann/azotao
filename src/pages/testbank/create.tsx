import { useState, useRef } from "react";
import { Content, Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { MinimalTiptapMinimal } from "@/components/minimal-tiptap/minimal-tiptap-minimal";
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
    <div className="h-screen w-full bg-white flex flex-col">
      {/* Fixed Header */}
      <header className="border-b shadow-sm px-6 py-3 bg-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4 flex-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 bg-gray-700 text-white hover:bg-gray-800 hover:text-white"
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
              className="h-9 border bg-gray-50 text-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0"
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
        <div className="w-1/2 p-0 overflow-hidden flex flex-col bg-gray-50">
          <div className="p-3 border-b font-medium text-sm text-gray-700 bg-gray-100">Preview</div>
          <div className="flex-1 overflow-auto p-5">
            <div className="prose prose-gray prose-img:rounded max-w-none text-gray-800">
              {editorContent ? (
                typeof editorContent === "string" ? (
                  <div dangerouslySetInnerHTML={{ __html: editorContent }} />
                ) : (
                  <div className="text-gray-800">Content will appear here</div>
                )
              ) : (
                <div className="text-gray-500 italic">
                  Your formatted test content will appear here as you type...
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Editor Pane */}
        <div className="w-1/2 border-l overflow-hidden flex flex-col bg-white">
          <div className="p-3 border-b font-medium text-sm text-gray-700 bg-gray-100">Editor</div>
          <div className="flex-1 p-0 overflow-hidden">
            <MinimalTiptapMinimal
              value={editorContent}
              onChange={setEditorContent}
              className="h-full border-0 shadow-none"
              editorContentClassName="p-5 h-full overflow-auto text-gray-800"
              placeholder="Enter your test content here..."
              autofocus={true}
              editable={true}
              output="html"
              showImageButton={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
