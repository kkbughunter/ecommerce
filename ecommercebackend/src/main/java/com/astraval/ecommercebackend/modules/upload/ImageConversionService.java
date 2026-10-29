package com.astraval.ecommercebackend.modules.upload;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Locale;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.astraval.ecommercebackend.common.exception.BadRequestException;

import net.coobird.thumbnailator.Thumbnails;

@Service
public class ImageConversionService {

    private final long maxFileBytes;
    private final long maxPixels;

    public ImageConversionService(
            @Value("${upload.image.max-file-bytes:52428800}") long maxFileBytes,
            @Value("${upload.image.max-pixels:50000000}") long maxPixels) {
        this.maxFileBytes = maxFileBytes;
        this.maxPixels = maxPixels;
    }

    public ImageInfo inspect(MultipartFile file) {
        if (file.getSize() > maxFileBytes) {
            throw new BadRequestException("Image exceeds the configured maximum size of " + maxFileBytes + " bytes");
        }

        try (ImageInputStream imageInput = ImageIO.createImageInputStream(file.getInputStream())) {
            if (imageInput == null) {
                throw unsupportedImage();
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);
            if (!readers.hasNext()) {
                throw unsupportedImage();
            }

            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInput, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                long pixels = Math.multiplyExact((long) width, (long) height);
                if (width < 1 || height < 1 || pixels > maxPixels) {
                    throw new BadRequestException(
                            "Image dimensions exceed the configured maximum of " + maxPixels + " pixels");
                }
                return new ImageInfo(width, height, contentType(reader.getFormatName()));
            } finally {
                reader.dispose();
            }
        } catch (ArithmeticException ex) {
            throw new BadRequestException("Image dimensions are invalid");
        } catch (IOException ex) {
            throw new BadRequestException("Unable to read the uploaded image");
        }
    }

    public BufferedImage decode(byte[] sourceBytes) {
        try (ByteArrayInputStream input = new ByteArrayInputStream(sourceBytes)) {
            BufferedImage image = ImageIO.read(input);
            if (image == null) {
                throw unsupportedImage();
            }
            return image;
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to decode image for processing", ex);
        }
    }

    public byte[] toWebp(BufferedImage source, int maxDimension, double quality) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            double scale = Math.min(1.0, maxDimension / (double) Math.max(source.getWidth(), source.getHeight()));
            Thumbnails.of(source)
                    .scale(scale)
                    .outputFormat("webp")
                    .outputQuality(quality)
                    .toOutputStream(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to encode WebP image", ex);
        }
    }

    private BadRequestException unsupportedImage() {
        return new BadRequestException("Unsupported or invalid image format");
    }

    private String contentType(String formatName) {
        return switch (formatName.toLowerCase(Locale.ROOT)) {
            case "jpeg", "jpg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "bmp" -> "image/bmp";
            case "webp" -> "image/webp";
            default -> "image/" + formatName.toLowerCase(Locale.ROOT);
        };
    }

    public record ImageInfo(int width, int height, String contentType) {
    }
}
