import React, { useState, useEffect } from 'react';
import { Upload, message } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import AvatarCropModal from './AvatarCropModal';

interface AvatarUploadProps {
  value?: string | File;
  onChange?: (value: string | File) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ value, onChange }) => {
  const [loading, setLoading] = useState(false);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [tempFile, setTempFile] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    // 当value改变时更新预览URL
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof value === 'string') {
      setPreviewUrl(value);
    } else {
      setPreviewUrl('');
    }
  }, [value]);

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片必须小于 2MB！');
      return false;
    }

    // 创建临时URL用于裁剪预览
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTempFile(reader.result);
        setCropModalVisible(true);
      }
    };
    reader.readAsDataURL(file);

    // 阻止自动上传
    return false;
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setLoading(true);
    try {
      // 将Blob转换为File对象
      const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      
      // 触发onChange
      onChange?.(croppedFile);
      
      setCropModalVisible(false);
      setTempFile('');
    } catch (error) {
      message.error('处理图片失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传头像</div>
    </div>
  );

  return (
    <>
      <Upload
        name="avatar"
        listType="picture-circle"
        showUploadList={false}
        beforeUpload={beforeUpload}
        accept="image/*"
      >
        {previewUrl ? (
          <img 
            src={previewUrl}
            alt="avatar" 
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
          />
        ) : (
          uploadButton
        )}
      </Upload>

      <AvatarCropModal
        open={cropModalVisible}
        imageUrl={tempFile}
        onCancel={() => {
          setCropModalVisible(false);
          setTempFile('');
        }}
        onOk={handleCropComplete}
      />
    </>
  );
};

export default AvatarUpload; 