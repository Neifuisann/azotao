import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Copy, ArrowLeft, ExternalLink } from "lucide-react";

export default function TestPublishSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [testLink, setTestLink] = useState("");
  const [testName, setTestName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const link = params.get("link");
    const name = params.get("name");
    
    if (link) {
      setTestLink(decodeURIComponent(link));
    }
    
    if (name) {
      setTestName(decodeURIComponent(name));
    }
  }, [location.search]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(testLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col">
      {/* Fixed Header */}
      <header className="border-b shadow-sm px-6 py-3 bg-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 bg-gray-700 text-white hover:bg-gray-800 hover:text-white"
            onClick={() => navigate("/testbank")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Test Bank
          </Button>
          <h1 className="text-lg font-medium text-gray-900">Test Published</h1>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-xl bg-white p-8 rounded-lg shadow-md border">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Published Successfully!</h2>
            {testName && <p className="text-lg text-gray-700 mb-2">"{testName}"</p>}
            <p className="text-gray-600">Your test is now available for students to take.</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Share this link with students:</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input 
                readOnly 
                value={testLink} 
                className="flex-1 bg-white" 
              />
              <Button 
                className={`${copied ? 'bg-green-600' : 'bg-blue-600'} hover:bg-blue-700 text-white`}
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200"
              onClick={() => navigate("/testbank")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Test Bank
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.open(testLink, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Published Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 