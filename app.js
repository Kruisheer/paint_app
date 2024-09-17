import { useState, useRef, useEffect } from 'react';
import { Button } from "/components/ui/button";
import { Card } from "/components/ui/card";
import { CardContent } from "/components/ui/card";
import { CardHeader } from "/components/ui/card";
import { CardTitle } from "/components/ui/card";
import { Label } from "/components/ui/label";

const colors = [
  { name: 'Red', value: 'red' },
  { name: 'Blue', value: 'blue' },
  { name: 'Green', value: 'green' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Black', value: 'black' },
];

const PaintingApp = () => {
  const [color, setColor] = useState('black');
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 5;
  }, []);

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
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setDrawing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card className="w-1/2">
        <CardHeader>
          <CardTitle>Painting App</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            className="w-full h-96 border border-gray-300"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
          <div className="flex space-x-2 mt-4">
            {colors.map((colorOption) => (
              <Button
                key={colorOption.name}
                variant={colorOption.value === color ? 'primary' : 'secondary'}
                onClick={() => setColor(colorOption.value)}
              >
                {colorOption.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaintingApp;
