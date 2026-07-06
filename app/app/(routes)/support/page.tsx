import React from "react";
import WalletConnect from "../../../components/web3/wallet-connect";
import Card from "../../../components/ui/card";
import { ExternalLink, Code, MessageCircle, Bug } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="flex flex-col min-h-full">
      <header className="flex justify-between items-center h-16 px-8 w-full border-b-2 border-black bg-[#faf9f8]">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold font-mono uppercase tracking-widest text-black">Network: Devnet</span>
        </div>
        <div className="flex items-center gap-4">
          <WalletConnect />
        </div>
      </header>

      <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8 font-mono text-black pb-20">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Support & Community</h2>
          <p className="text-[#5C4E4E] font-semibold text-sm uppercase tracking-widest">
            Connect, report issues, and follow the project
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a href="https://github.com/Yashb404/jetty/issues" target="_blank" rel="noopener noreferrer" className="block">
            <Card className="h-full hover:bg-black hover:text-white transition-colors cursor-pointer group flex flex-col justify-between border-4 border-black">
              <div>
                <Bug className="w-8 h-8 mb-4" />
                <h4 className="font-bold uppercase tracking-wide mb-2 text-xl">Report an Issue</h4>
                <p className="text-sm mb-4 group-hover:text-gray-300 text-[#5C4E4E]">
                  Found a bug or have a feature request? Open an issue on our GitHub tracker.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                Open Issue <ExternalLink className="w-4 h-4" />
              </div>
            </Card>
          </a>

          <a href="https://github.com/Yashb404/jetty" target="_blank" rel="noopener noreferrer" className="block">
            <Card className="h-full hover:bg-black hover:text-white transition-colors cursor-pointer group flex flex-col justify-between border-4 border-black">
              <div>
                <Code className="w-8 h-8 mb-4" />
                <h4 className="font-bold uppercase tracking-wide mb-2 text-xl">Source Code</h4>
                <p className="text-sm mb-4 group-hover:text-gray-300 text-[#5C4E4E]">
                  Jetty is fully open-source. Explore the smart contracts and frontend code.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                View Repository <ExternalLink className="w-4 h-4" />
              </div>
            </Card>
          </a>

          <a href="https://x.com/YashB404" target="_blank" rel="noopener noreferrer" className="block md:col-span-2">
            <Card className="h-full hover:bg-[#1DA1F2] hover:border-[#1DA1F2] hover:text-white transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between border-4 border-black">
              <div className="flex items-start sm:items-center gap-4">
                <MessageCircle className="w-8 h-8 sm:mb-0 mb-4" />
                <div>
                  <h4 className="font-bold uppercase tracking-wide mb-1 text-xl">Follow on X</h4>
                  <p className="text-sm group-hover:text-white text-[#5C4E4E]">
                    Stay up to date with the latest features, announcements, and developments.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold mt-4 sm:mt-0">
                @YashB404 <ExternalLink className="w-4 h-4" />
              </div>
            </Card>
          </a>
        </div>
      </div>
    </div>
  );
}
