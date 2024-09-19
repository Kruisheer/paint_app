import { useState, useRef, useEffect } from "react";
import Button from "./components/ui/Button";  // Correct relative path
import Card from "./components/ui/Card";      // Correct relative path
import CardContent from "./components/ui/CardContent"; // Ensure these components exist
import CardHeader from "./components/ui/CardHeader";   // Ensure these components exist
import CardTitle from "./components/ui/CardTitle";     // Ensure these components exist
import Label from "./components/ui/Label";             // Correct relative path
#import { Slider } from "@/components/ui/slider";
import Slider from "./components/ui/Slider";
import { Star, Sun, Moon } from "lucide-react";

const colors = [
  { name: 'Pink', value: '#FF69B4' },
  { name: 'Purple', value: '#8A2BE2' },
  { name: 'Yellow', value: '#FFD700' },
  { name: 'Sky Blue', value: '#87CEEB' },
  { name: 'Lime Green', value: '#32CD32' },
  { name: 'Rainbow', value: 'rainbow' },
];

const rainbowColors = ['#FF69B4', '#FFD700', '#87CEEB', '#32CD32', '#8A2BE2', '#FFA500'];

const images = [
  { name: 'Fish', svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M70 50 C90 30, 90 70, 70 50 L30 30 C10 40, 10 60, 30 70 Z" fill="none" stroke="black" stroke-width="2"/>
    <circle cx="75" cy="50" r="3" />
  </svg>` },
  { name: 'Unicorn', svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 70 Q40 60, 50 70 Q60 80, 70 70 L80 40 L60 20 L40 40 Z" fill="none" stroke="black" stroke-width="2"/>
    <path d="M60 20 L70 10" fill="none" stroke="black" stroke-width="2"/>
    <circle cx="45" cy="45" r="3" />
  </svg>` },
  { name: 'Cheetah', svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 50 Q30 20, 50 20 Q70 20, 80 50 Q70 80, 50 80 Q30 80, 20 50 Z" fill="none" stroke="black" stroke-width="2"/>
    <circle cx="35" cy="40" r="3" />
    <circle cx="65" cy="40" r="3" />
    <path d="M50 50 Q55 55, 50 60 Q45 55, 50 50" fill="none" stroke="black" stroke-width="2"/>
  </svg>` },
];

const PaintingApp = () => {
  const [color, setColor] = useState('#FF69B4');
  const [brushSize, setBrushSize] = useState(10);
  const [drawing, setDrawing] = useState(false);
  const [activeLayer, setActiveLayer] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 200 });
  const [selectedImage, setSelectedImage] = useState(null);
  const colorIndexRef = useRef(0);
  const canvasRefs = [useRef(null), useRef(null), useRef(null)];
  const containerRef = useRef(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: Math.max(width - 200, 1),
          height: Math.max(height - 200, 1),
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    canvasRefs.forEach((canvasRef, index) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = brushSize;
        
        if (index === 0 && selectedImage) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = `data:image/svg+xml;base64,${btoa(selectedImage.svg)}`;
        }
      }
    });
  }, [canvasSize, brushSize, selectedImage]);

  const getNextColor = () => {
    if (color === 'rainbow') {
      const nextColor = rainbowColors[colorIndexRef.current];
      colorIndexRef.current = (colorIndexRef.current + 1) % rainbowColors.length;
      return nextColor;
    }
    return color;
  };

  const handleMouseDown = (e) => {
    setDrawing(true);
    const canvas = canvasRefs[activeLayer - 1].current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = getNextColor();
    }
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const canvas = canvasRefs[activeLayer - 1].current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.lineTo(x, y);
      ctx.strokeStyle = getNextColor();
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  const handleBrushSizeChange = (value) => {
    setBrushSize(value[0]);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-pink-100 to-purple-100" ref={containerRef}>
      <h1 className="text-4xl font-bold text-center text-pink-500 py-4">Magic Painting!</h1>
      <div className="flex justify-center space-x-4 mb-4">
        {images.map((image) => (
          <Button
            key={image.name}
            onClick={() => setSelectedImage(image)}
            className={`w-24 h-24 p-2 rounded-xl ${selectedImage === image ? 'bg-purple-500' : 'bg-white'}`}
          >
            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: image.svg }} />
          </Button>
        ))}
      </div>
      <div className="flex flex-1">
        <div className="w-24 flex flex-col justify-center space-y-4 p-2">
          {[
            { layer: 1, icon: Star, label: 'Back' },
            { layer: 2, icon: Sun, label: 'Middle' },
            { layer: 3, icon: Moon, label: 'Front' }
          ].map(({ layer, icon: Icon, label }) => (
            <Button
              key={layer}
              variant={layer === activeLayer ? 'default' : 'outline'}
              onClick={() => setActiveLayer(layer)}
              className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${layer === activeLayer ? 'bg-purple-500 text-white' : 'bg-white text-purple-500'}`}
            >
              <Icon size={32} />
              <span className="mt-2 text-xs">{label}</span>
            </Button>
          ))}
        </div>
        <div className="flex-1 relative border-8 border-purple-300 rounded-lg overflow-hidden">
          {canvasRefs.map((canvasRef, index) => (
            <canvas
              key={index}
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="absolute top-0 left-0"
              style={{zIndex: index}}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          ))}
        </div>
        <div className="w-24 flex flex-col justify-center space-y-4 p-2">
          {colors.map((colorOption) => (
            <Button
              key={colorOption.name}
              variant={colorOption.value === color ? 'default' : 'outline'}
              onClick={() => setColor(colorOption.value)}
              className="w-20 h-20 rounded-full"
              style={{backgroundColor: colorOption.value === 'rainbow' ? 'white' : colorOption.value, border: colorOption.value === color ? '4px solid #8A2BE2' : 'none'}}
            >
              {colorOption.value === 'rainbow' && (
                <div className="w-full h-full rounded-full bg-gradient-to-r from-pink-500 via-yellow-500 to-blue-500" />
              )}
            </Button>
          ))}
        </div>
      </div>
      <div className="w-full max-w-sm mx-auto p-4">
        <h2 className="text-2xl font-bold text-purple-500 mb-2">Brush Size</h2>
        <Slider
          value={[brushSize]}
          onValueChange={handleBrushSizeChange}
          min={1}
          max={50}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between mt-2">
          <span>Small</span>
          <span>Big</span>
        </div>
      </div>
    </div>
  );
};

export default PaintingApp;
