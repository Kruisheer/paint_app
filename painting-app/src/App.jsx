import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const colors = [
  { name: 'Red', value: 'red' },
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Black', value: 'black' },
];

const PaintingApp = () => {
  const [color, setColor] = useState('black');
  const [brushSize, setBrushSize] = useState(5);
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight - 150, // Subtracting 150px for the color buttons and brush size slider
      });
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = brushSize;
    
    // Clear canvas and redraw when size changes
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
  }, [canvasSize, brushSize]);

  const handleMouseDown = (e) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleMouseMove = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  const handleBrushSizeChange = (value) => {
    setBrushSize(value[0]);
  };

  return (
    <div className="flex flex-col h-screen">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="flex-grow"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="flex flex-col items-center space-y-4 p-4">
        <div className="flex justify-center space-x-2">
          {colors.map((colorOption) => (
            <Button
              key={colorOption.name}
              variant={colorOption.value === color ? 'default' : 'outline'}
              onClick={() => setColor(colorOption.value)}
              className="w-20"
            >
              {colorOption.name}
            </Button>
          ))}
        </div>
        <div className="w-full max-w-xs">
          <Card>
            <CardHeader>
              <CardTitle>Brush Size: {brushSize}px</CardTitle>
            </CardHeader>
            <CardContent>
              <Slider
                value={[brushSize]}
                onValueChange={handleBrushSizeChange}
                min={1}
                max={50}
                step={1}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaintingApp;
