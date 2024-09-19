import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Slider,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { Star, Sun, Moon } from 'lucide-react';

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
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [selectedImage, setSelectedImage] = useState(null);
  const colorIndexRef = useRef(0);
  const canvasRefs = [useRef(null), useRef(null), useRef(null)];
  const containerRef = useRef(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height: height - 150 }); // Subtract space for controls
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
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (index === 0 && selectedImage) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = `data:image/svg+xml;base64,${btoa(selectedImage.svg)}`;
        }
      }
    });
  }, [canvasSize, selectedImage]);

  const getNextColor = () => {
    if (color === 'rainbow') {
      const nextColor = rainbowColors[colorIndexRef.current];
      colorIndexRef.current = (colorIndexRef.current + 1) % rainbowColors.length;
      return nextColor;
    }
    return color;
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setDrawing(true);
    const canvas = canvasRefs[activeLayer - 1].current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = getNextColor();
      ctx.lineWidth = brushSize;
    }
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRefs[activeLayer - 1].current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX || e.touches[0].clientX) - rect.left;
      const y = (e.clientY || e.touches[0].clientY) - rect.top;
      ctx.lineTo(x, y);
      ctx.strokeStyle = getNextColor();
      ctx.lineWidth = brushSize;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const stopDrawing = () => {
    setDrawing(false);
  };

  const handleBrushSizeChange = (event, newValue) => {
    setBrushSize(newValue);
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'linear-gradient(to bottom, #FFE6F0, #E6E6FA)',
      }}
    >
      <Typography variant="h4" align="center" color="primary" sx={{ py: 1 }}>
        Magic Painting!
      </Typography>
      <Box sx={{ display: 'flex', flex: 1, position: 'relative' }}>
        <Box sx={{ width: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 1 }}>
          {[
            { layer: 1, icon: Star, label: 'Back' },
            { layer: 2, icon: Sun, label: 'Middle' },
            { layer: 3, icon: Moon, label: 'Front' }
          ].map(({ layer, icon: Icon, label }) => (
            <Button
              key={layer}
              variant={layer === activeLayer ? 'contained' : 'outlined'}
              onClick={() => setActiveLayer(layer)}
              sx={{
                width: 60,
                height: 60,
                borderRadius: 2,
                mb: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={24} />
              <Typography variant="caption" sx={{ mt: 0.5 }}>{label}</Typography>
            </Button>
          ))}
        </Box>
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            border: 4,
            borderColor: 'secondary.light',
            borderRadius: 2,
            overflow: 'hidden',
            touchAction: 'none',
          }}
        >
          {canvasRefs.map((canvasRef, index) => (
            <canvas
              key={index}
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: index,
                display: index <= activeLayer - 1 ? 'block' : 'none',
                opacity: 1 - (activeLayer - 1 - index) * 0.2,
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          ))}
        </Box>
        <Box sx={{ width: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 1 }}>
          {colors.map((colorOption) => (
            <Button
              key={colorOption.name}
              variant={colorOption.value === color ? 'contained' : 'outlined'}
              onClick={() => setColor(colorOption.value)}
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                mb: 1,
                backgroundColor: colorOption.value === 'rainbow' ? 'white' : colorOption.value,
                border: colorOption.value === color ? '4px solid' : 'none',
                borderColor: 'secondary.main',
                '&:hover': {
                  backgroundColor: colorOption.value === 'rainbow' ? 'grey.100' : colorOption.value,
                },
              }}
            >
              {colorOption.value === 'rainbow' && (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: 'linear-gradient(to right, #FF69B4, #FFD700, #87CEEB)',
                  }}
                />
              )}
            </Button>
          ))}
        </Box>
      </Box>
      <Card sx={{ m: 1 }}>
        <CardHeader title="Brush Size" sx={{ py: 1 }} />
        <CardContent>
          <Slider
            value={brushSize}
            onChange={handleBrushSizeChange}
            min={1}
            max={50}
            step={1}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption">Small</Typography>
            <Typography variant="caption">Big</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaintingApp;
