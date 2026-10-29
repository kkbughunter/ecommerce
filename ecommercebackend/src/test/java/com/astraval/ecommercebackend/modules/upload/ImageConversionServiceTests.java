package com.astraval.ecommercebackend.modules.upload;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class ImageConversionServiceTests {

    private final ImageConversionService service = new ImageConversionService(5_000_000, 10_000_000);

    @Test
    void inspectsAndConvertsRasterImageToWebpWithoutUpscaling() throws Exception {
        BufferedImage source = new BufferedImage(640, 480, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = source.createGraphics();
        graphics.setColor(Color.BLUE);
        graphics.fillRect(0, 0, source.getWidth(), source.getHeight());
        graphics.dispose();

        ByteArrayOutputStream pngOutput = new ByteArrayOutputStream();
        ImageIO.write(source, "png", pngOutput);
        byte[] png = pngOutput.toByteArray();
        MockMultipartFile file = new MockMultipartFile("files", "sample.png", "image/png", png);

        ImageConversionService.ImageInfo info = service.inspect(file);
        byte[] webp = service.toWebp(service.decode(png), 320, 0.78);
        BufferedImage converted = ImageIO.read(new ByteArrayInputStream(webp));

        assertThat(info.width()).isEqualTo(640);
        assertThat(info.height()).isEqualTo(480);
        assertThat(info.contentType()).isEqualTo("image/png");
        assertThat(webp).isNotEmpty();
        assertThat(converted).isNotNull();
        assertThat(converted.getWidth()).isEqualTo(320);
        assertThat(converted.getHeight()).isEqualTo(240);
    }
}
