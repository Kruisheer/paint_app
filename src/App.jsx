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
import { Star, Moon } from 'lucide-react';
import DOMPurify from 'dompurify';

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
  const [activeLayer, setActiveLayer] = useState(1); // 1: Back, 2: Images, 3: Front
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageScale, setImageScale] = useState(1); // Scale factor starting at 1
  const [positionSet, setPositionSet] = useState(false); // To track if position is set
  const [tabValue, setTabValue] = useState(0); // For Tabs
  const [stamps, setStamps] = useState([]); // Array to hold all stamps
  const [maxScale, setMaxScale] = useState(3); // Default maximum scale

  const colorIndexRef = useRef(0);
  const canvasRefs = [useRef(null), useRef(null), useRef(null)];
  const containerRef = useRef(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width, height: height - 400 }); // Adjusted for additional controls
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    if (selectedImage) {
      // Parse the SVG to get intrinsic dimensions
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(selectedImage.svg, "image/svg+xml");
      const svgElement = svgDoc.querySelector('svg');

      const intrinsicWidth = parseFloat(svgElement.getAttribute('width')) || 100; // Default to 100 if not specified
      const intrinsicHeight = parseFloat(svgElement.getAttribute('height')) || 100;

      // Calculate maximum scale based on canvas size
      const maxScaleX = canvasSize.width / intrinsicWidth;
      const maxScaleY = canvasSize.height / intrinsicHeight;
      const calculatedMaxScale = Math.min(maxScaleX, maxScaleY, 3); // Limit to a maximum of 3x for practicality

      setMaxScale(calculatedMaxScale);
      if (imageScale > calculatedMaxScale) {
        setImageScale(calculatedMaxScale);
      }
    }
  }, [selectedImage, canvasSize]);

  useEffect(() => {
    const canvas = canvasRefs[1].current; // Middle layer for images
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous stamps

      stamps.forEach((stamp) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(
            img,
            stamp.x,
            stamp.y,
            img.width * stamp.scale,
            img.height * stamp.scale
          );
        };
        img.src = `data:image/svg+xml;base64,${btoa(stamp.svg)}`;
      });
    }
  }, [stamps, canvasSize]);

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
    canvasRefs.forEach((canvasRef, index) => {
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
      stamps,
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
    if (file && file.type === 'image/png') {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (event) => {
        img.onload = () => {
          // Clear all canvases
          canvasRefs.forEach((canvasRef) => {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
          });
          // Draw the loaded image onto the frontmost canvas
          const frontCanvas = canvasRefs[2].current; // Front layer
          const ctx = frontCanvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid PNG image.');
    }
  };

  const handleLoadProject = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const state = JSON.parse(event.target.result);
          if (state.stamps && state.drawings) {
            setStamps(state.stamps);

            // Restore drawings on respective canvases
            state.drawings.forEach((dataURL, index) => {
              const img = new Image();
              img.onload = () => {
                const ctx = canvasRefs[index].current.getContext('2d');
                ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
                ctx.drawImage(img, 0, 0);
              };
              img.src = dataURL;
            });
          } else {
            alert('Invalid project file.');
          }
        } catch (error) {
          alert('Error loading project. Please ensure the file is a valid JSON.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid JSON project file.');
    }
  };

  const handleCanvasClick = (e) => {
    if (selectedImage && !positionSet) {
      const canvas = canvasRefs[activeLayer - 1].current;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Create a temporary DOM element to parse the SVG and get its intrinsic dimensions
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(selectedImage.svg, "image/svg+xml");
      const svgElement = svgDoc.querySelector('svg');

      const intrinsicWidth = parseFloat(svgElement.getAttribute('width')) || 100; // Default to 100 if not specified
      const intrinsicHeight = parseFloat(svgElement.getAttribute('height')) || 100;

      // Calculate the top-left position to center the SVG at the click point
      const x = clickX - (intrinsicWidth * imageScale) / 2;
      const y = clickY - (intrinsicHeight * imageScale) / 2;

      // Add the new stamp to the stamps array
      setStamps([...stamps, { svg: selectedImage.svg, x, y, scale: imageScale }]);

      // Reset selection
      setSelectedImage(null);
      setImageScale(1);
      setPositionSet(true);
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh', // Changed from height to minHeight
        width: '100vw',
        overflowY: 'auto', // Allow vertical scrolling
        background: 'linear-gradient(to bottom, #FFE6F0, #E6E6FA)',
      }}
    >
      <Typography variant="h4" align="center" color="primary" sx={{ py: 1 }}>
        Magic Painting!
      </Typography>
      
      {/* Image Selection Panel */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2, // Increased gap for better spacing
          p: 2,   // Increased padding for better spacing
          flexWrap: 'wrap',
        }}
      >
        {images.map((img) => (
          <Button
            key={img.name}
            variant={selectedImage && selectedImage.svg === img.svg ? 'contained' : 'outlined'}
            onClick={() => {
              setSelectedImage(img);
              setImageScale(1); // Reset scale
              setPositionSet(false); // Allow setting position for the new stamp
            }}
            sx={{
              textTransform: 'none',
              width: 80,
              height: 80,
              padding: 0, // Remove padding to utilize full button size
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
            }}
            aria-label={`Select ${img.name} stamp`}
          >
            {/* Using <img> tag for better control over SVG sizing */}
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(img.svg)}`}
              alt={img.name}
              style={{
                width: '60%', // 60% of the button size
                height: '60%', // 60% of the button size
                objectFit: 'contain',
              }}
            />
          </Button>
        ))}
      </Box>
      
      {/* Layer and Canvas Area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' }, // Stack on small screens
          flex: 1,
          position: 'relative',
        }}
      >
        {/* Layer Controls */}
        <Box
          sx={{
            width: { xs: '100%', md: 80 }, // Full width on small screens
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 1,
          }}
        >
          {[
            { layer: 1, icon: Star, label: 'Back' },
            // Removed the middle layer button
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
              aria-label={`Select ${label} layer`}
            >
              <Icon size={24} />
              <Typography variant="caption" sx={{ mt: 0.5 }}>{label}</Typography>
            </Button>
          ))}
        </Box>
        
        {/* Canvas Area */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            border: '4px solid',
            borderColor: 'secondary.light',
            borderRadius: 2,
            overflow: 'hidden',
            touchAction: 'none',
            height: { xs: 300, md: 'auto' }, // Set a fixed height on small screens
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
              onClick={handleCanvasClick} // Handle stamp placement
            />
          ))}
        </Box>
        
        {/* Color Palette */}
        <Box
          sx={{
            width: { xs: '100%', md: 80 }, // Full width on small screens
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 1,
          }}
        >
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={`Select ${colorOption.name} color`}
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
      
      {/* Brush Size Slider */}
      <Card
        sx={{
          m: 1,
          order: { xs: 3, md: 2 }, // Position before Save/Load on small screens
        }}
      >
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
      
      {/* Save/Load Buttons Positioned Below Brush Size Slider */}
      <Box
        sx={{
          width: '100%',
          mb: 2,
          px: 2,
          order: { xs: 4, md: 3 }, // Ensure it's below the slider on small screens
        }}
      >
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Save/Load" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          {/* Save and Load Buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' }, // Stack on extra-small screens
              justifyContent: 'center',
              gap: 2,
              p: 1,
              flexWrap: 'wrap',
            }}
          >
            {/* Save as Image */}
            <Button
              variant="contained"
              color="success"
              onClick={handleSaveAsImage}
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
            >
              Save as Image
            </Button>

            {/* Save Project (JSON) */}
            <Button
              variant="contained"
              color="info"
              onClick={handleSaveProject}
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
            >
              Save Project
            </Button>

            {/* Load Image */}
            <Button
              variant="contained"
              color="primary"
              component="label"
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
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
              sx={{ textTransform: 'none', width: { xs: '100%', sm: 'auto' } }}
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
    </Box>
  );
};

export default PaintingApp;
