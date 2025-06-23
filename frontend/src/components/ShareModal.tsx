import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Link, MessageCircle, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { generateShareableUrl } from "@/lib/metaTagService";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      const shareableUrl = generateShareableUrl(url, 'copy');
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      toast.success('📋 Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        const shareableUrl = generateShareableUrl(url, 'native');
        await navigator.share({
          title: `Join me at ${title}`,
          text: `Hey! I'm organizing a drinking session. Come join us!`,
          url: shareableUrl,
        });
      } catch (err) {
        console.error("Failed to share:", err);
        toast.error('Failed to share');
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const shareableUrl = generateShareableUrl(url, 'whatsapp');
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      `🍺 ${title} ${shareableUrl}`
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleFacebookShare = () => {
    const shareableUrl = generateShareableUrl(url, 'facebook');
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareableUrl
    )}`;
    window.open(facebookUrl, "_blank");
  };

  const handleSMSShare = () => {
    const shareableUrl = generateShareableUrl(url, 'copy');
    const message = `🍻 Join me for "${title}"! ${shareableUrl}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, "_blank");
  };

  const handleTwitterShare = () => {
    const shareableUrl = generateShareableUrl(url, 'twitter');
    const tweetText = `🍺 Join me for "${title}"! Let's raise some hell together 🤘`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareableUrl)}`;
    window.open(twitterUrl, "_blank");
  };

  const handleLinkedInShare = () => {
    const shareableUrl = generateShareableUrl(url, 'linkedin');
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl)}`;
    window.open(linkedinUrl, "_blank");
  };

  const handleInstagramShare = () => {
    // Instagram doesn't have direct URL sharing, so we copy the link and show instructions
    handleCopyLink();
    toast.info('📱 Link copied! Paste it in your Instagram story or DM');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Event</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={handleCopyLink}
            >
              <Link className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <p className="text-sm font-medium">Copy Link</p>
              <p className="text-sm text-muted-foreground">
                {copied ? "Copied!" : "Copy the event link"}
              </p>
            </div>
          </div>

          {typeof navigator.share === 'function' && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={handleNativeShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <p className="text-sm font-medium">Share</p>
                <p className="text-sm text-muted-foreground">
                  Share using your device's native share options
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <p className="text-sm font-medium">WhatsApp</p>
              <p className="text-sm text-muted-foreground">
                Share on WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={handleSMSShare}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <p className="text-sm font-medium">SMS</p>
              <p className="text-sm text-muted-foreground">
                Share via text message
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={handleFacebookShare}
            >
              <span className="text-blue-600 font-bold text-sm">f</span>
            </Button>
            <div className="flex-1">
              <p className="text-sm font-medium">Facebook</p>
              <p className="text-sm text-muted-foreground">
                Share on Facebook
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={handleTwitterShare}
            >
              <span className="text-black font-bold text-sm">𝕏</span>
            </Button>
            <div className="flex-1">
              <p className="text-sm font-medium">Twitter / X</p>
              <p className="text-sm text-muted-foreground">
                Share on Twitter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={handleLinkedInShare}
            >
              <span className="text-blue-700 font-bold text-sm">in</span>
            </Button>
            <div className="flex-1">
              <p className="text-sm font-medium">LinkedIn</p>
              <p className="text-sm text-muted-foreground">
                Share on LinkedIn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10"
              onClick={handleInstagramShare}
            >
              <span className="text-pink-500 font-bold text-sm">📷</span>
            </Button>
            <div className="flex-1">
              <p className="text-sm font-medium">Instagram</p>
              <p className="text-sm text-muted-foreground">
                Copy link for Instagram story/DM
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}