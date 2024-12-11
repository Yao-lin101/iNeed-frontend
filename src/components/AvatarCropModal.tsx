import React, { useState, useCallback } from 'react';
import { Modal, Button, Slider } from 'antd';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

interface AvatarCropModalProps {
  open: boolean;
  imageUrl: string;
  onCancel: () => void;
  onOk: (croppedImage: Blob) => void;
}

const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  open,
  imageUrl,
  onCancel,
  onOk,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // 设置画布尺寸为裁剪尺寸
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // 在画布上绘制裁剪的图像
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // 将画布转换为Blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas is empty'));
          }
        },
        'image/jpeg',
        1
      );
    });
  };

  const handleOk = async () => {
    if (croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageUrl, croppedAreaPixels);
        onOk(croppedImage);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <Modal
      title="裁剪头像"
      open={open}
      onCancel={onCancel}
      width={520}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          确定
        </Button>,
      ]}
    >
      <div className="relative h-[300px] w-full mb-4">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          cropShape="round"
          showGrid={false}
        />
      </div>
      <div className="px-4">
        <p className="mb-2 text-gray-600">缩放</p>
        <Slider
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={setZoom}
        />
      </div>
    </Modal>
  );
};

export default AvatarCropModal; 