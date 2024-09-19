// src/PaintingApp.jsx

import React, { useState, useRef, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Slider,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
} from '@mui/material';
import { Star, Sun, Moon } from 'lucide-react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

// Import SVGs as raw strings
import fishSVG from './assets/images/fish.svg?raw';
import unicornSVG from './assets/images/unicorn.svg?raw';
import cheetahSVG from './assets/images/cheetah.svg?raw';

// TabPanel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`painting-tabpanel-${index}`}
      aria-labelledby={`painting-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const colors = [
  { name: 'Pink', value: '#FF69B4' },
  { name: 'Purple', value: '#8A2BE2' },
  { name: 'Yellow', value: '#FFD700' },
  { name: 'Sky Blue', value: '#87CEEB' },
  { name: 'Lime Green', value: '#32CD32' },
  { name: 'Rainbow', value: 'rainbow' },
];

const rainbowColors = ['#FF69B4', '#FFD700', '#87CEEB', '#32CD32', '#8A2BE2', '#FFA500'];

// Updated images array with imported SVGs
const images = [
  { name: 'Fish', svg: fishSVG },
  { name: 'Unicorn', svg: unicornSVG },
  { name: 'Cheetah', svg: cheetahSVG },
];

const PaintingApp = () => {
  const [color, setColor] = useState('#FF69B4');
  const [brushSize, setBrushSize] = useState(10);
  const [drawing, setDrawing] = useState(false);
  const [activeLayer, setActiveLayer] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 }); // Initial position
  const [imageSize, setImageSize] = useState({ width: 200, height: 200 }); // Initial size
  const [tabValue, setTabValue] = useState(0); // For Tabs

  const colorIndexRef = useRef(0);
  const canvasRefs = [useRef(null), useRef(null), useRef(null)];
  const containerRef = useRef(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height: height - 350 }); // Adjusted for additional controls
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
        
        if (index === 1) { // Middle layer
          if (selectedImage) {
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous image
              ctx.drawImage(img, imagePosition.x, imagePosition.y, imageSize.width, imageSize.height);
            };
            img.src = `data:image/svg+xml;base64,${btoa(selectedImage.svg)}`;
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas if no image
          }
        }
      }
    });
  }, [canvasSize, selectedImage, imagePosition, imageSize]);

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
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
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
      const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
      const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handler Functions for Save/Load
  const handleSaveAsImage = () => {
    // Create a temporary canvas to combine layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw each layer onto the temporary canvas
    canvasRefs.forEach((canvasRef) => {
      const canvas = canvasRef.current;
      if (canvas) {
        tempCtx.drawImage(canvas, 0, 0);
      }
    });

    // Convert the temporary canvas to a data URL and trigger download
    const dataURL = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'painting.png';
    link.click();
  };

  const handleSaveProject = () => {
    const state = {
      selectedImage,
      imagePosition,
      imageSize,
      drawings: canvasRefs.map((canvasRef) => canvasRef.current.toDataURL()),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = 'painting.json';
    link.click();
  };

  const handleLoadImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (event) => {
        img.onload = () => {
          // Clear all canvases
          canvasRefs.forEach((canvasRef, index) => {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
          });
          // Draw the loaded image onto the topmost canvas
          const topCanvas = canvasRefs[2].current; // Front layer
          const ctx = topCanvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadProject = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const state = JSON.parse(event.target.result);
        // Restore selectedImage, position, and size
        setSelectedImage(state.selectedImage);
        setImagePosition(state.imagePosition);
        setImageSize(state.imageSize);
        // Restore drawings
        state.drawings.forEach((dataURL, index) => {
          const img = new Image();
          img.onload = () => {
            const ctx = canvasRefs[index].current.getContext('2d');
            ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = dataURL;
        });
      };
      reader.readAsText(file);
    }
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
      
      {/* Image Selection Panel */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, p: 1, flexWrap: 'wrap' }}>
        {images.map((img) => (
          <Button
            key={img.name}
            variant={selectedImage && selectedImage.name === img.name ? 'contained' : 'outlined'}
            onClick={() => {
              setSelectedImage(img);
              setImagePosition({ x: 50, y: 50 }); // Reset position
              setImageSize({ width: 200, height: 200 }); // Reset size
            }}
            sx={{ textTransform: 'none' }}
          >
            {img.name}
          </Button>
        ))}
      </Box>
      
      {/* Clear Image Button */}
      {selectedImage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, p: 1 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setSelectedImage(null)}
            sx={{ textTransform: 'none' }}
          >
            Clear Image
          </Button>
        </Box>
      )}

      {/* Draggable and Resizable Controls */}
      {selectedImage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, p: 1, flexWrap: 'wrap' }}>
          {/* Draggable Controls */}
          <Draggable
            position={imagePosition}
            onStop={(e, data) => {
              setImagePosition({ x: data.x, y: data.y });
            }}
          >
            <Box sx={{ border: '1px dashed grey', padding: 1, cursor: 'move' }}>
              Drag Image
            </Box>
          </Draggable>

          {/* Resizable Controls */}
          <ResizableBox
            width={imageSize.width}
            height={imageSize.height}
            minConstraints={[50, 50]}
            maxConstraints={[canvasSize.width, canvasSize.height]}
            onResizeStop={(event, { size }) => {
              setImageSize({ width: size.width, height: size.height });
            }}
          >
            <Box sx={{ border: '1px dashed grey', padding: 1, width: '100%', height: '100%', boxSizing: 'border-box' }}>
              Resize Image
            </Box>
          </ResizableBox>
        </Box>
      )}

      {/* Tabs for Save/Load Controls */}
      <Box sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Save/Load" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          {/* Save and Load Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, p: 1, flexWrap: 'wrap' }}>
            {/* Save as Image */}
            <Button
              variant="contained"
              color="success"
              onClick={handleSaveAsImage}
              sx={{ textTransform: 'none' }}
            >
              Save as Image
            </Button>

            {/* Save Project (JSON) */}
            <Button
              variant="contained"
              color="info"
              onClick={handleSaveProject}
              sx={{ textTransform: 'none' }}
            >
              Save Project
            </Button>

            {/* Load Image */}
            <Button
              variant="contained"
              color="primary"
              component="label"
              sx={{ textTransform: 'none' }}
            >
              Load Image
              <input
                type="file"
                accept="image/png"
                hidden
                onChange={handleLoadImage}
              />
            </Button>

            {/* Load Project */}
            <Button
              variant="contained"
              color="secondary"
              component="label"
              sx={{ textTransform: 'none' }}
            >
              Load Project
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={handleLoadProject}
              />
            </Button>
          </Box>
        </TabPanel>
      </Box>

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
            border: '4px solid',
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
                zIndex: index + 1, // Ensure proper stacking order
                display: 'block', // Always display all layers
                opacity: 1,
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
