import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMusic, faCog, faVolumeUp } from '@fortawesome/free-solid-svg-icons';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo 和品牌 */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FontAwesomeIcon
                icon={faVolumeUp}
                className="w-6 h-6 text-blue-600"
              />
              <h1 className="text-xl font-bold text-gray-900">TTS 服务</h1>
            </div>
          </div>

          {/* 导航链接 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              <FontAwesomeIcon icon={faMicrophone} className="w-4 h-4" />
              <span>文本转语音</span>
            </Link>

            <Link
              to="/voice-library"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              <FontAwesomeIcon icon={faMusic} className="w-4 h-4" />
              <span>声音库</span>
            </Link>
          </div>

          {/* 设置按钮 */}
          <div className="flex items-center space-x-4">
            {/* 设置按钮 */}
            <Button
              onClick={onOpenSettings}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              title="设置"
            >
              <FontAwesomeIcon icon={faCog} className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 移动端导航 */}
        <div className="md:hidden border-t border-gray-200/50 py-3">
          <div className="flex space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm"
            >
              <FontAwesomeIcon icon={faMicrophone} className="w-4 h-4" />
              <span>文本转语音</span>
            </Link>

            <Link
              to="/voice-library"
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium text-sm"
            >
              <FontAwesomeIcon icon={faMusic} className="w-4 h-4" />
              <span>声音库</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};