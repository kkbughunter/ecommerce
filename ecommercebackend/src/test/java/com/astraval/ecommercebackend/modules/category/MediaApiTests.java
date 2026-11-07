package com.astraval.ecommercebackend.modules.category;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.http.MediaType;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.mockito.Mockito.*;
import com.astraval.ecommercebackend.modules.upload.R2StorageService;
import com.astraval.ecommercebackend.modules.homeslider.HomeSliderRepository;
import com.astraval.ecommercebackend.modules.mainbanner.MainBannerRepository;
@SpringBootTest(properties = {
 "spring.datasource.url=jdbc:h2:mem:media-api;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
 "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa", "spring.datasource.password=",
 "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never",
 "spring.jpa.defer-datasource-initialization=false", "r2.enabled=false",
 "jwt.secret=test-secret-key-test-secret-key-123456"
})
class MediaApiTests {
 @Autowired WebApplicationContext context;
 @Autowired CategoryRepository categories;
 @Autowired HomeSliderRepository sliders;
 @Autowired MainBannerRepository banners;
 @MockitoBean R2StorageService storage;
 MockMvc mvc;
 @BeforeEach void setup() {
  mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  when(storage.isEnabled()).thenReturn(true);
  when(storage.publicUrl(anyString())).thenAnswer(i -> "https://cdn.example/"+i.getArgument(0));
 }
 @Test void onlySuperAdminMayManageCategories() throws Exception {
  Category category=new Category(); category.setCategoryName("API category"); category=categories.save(category);
  String path="/api/categories/"+category.getCategoryId();
  mvc.perform(put(path).with(user("1").roles("ADMIN")).contentType(MediaType.APPLICATION_JSON)
    .content("{\"categoryName\":\"Renamed category\"}"))
    .andExpect(status().isForbidden());
  mvc.perform(put(path).with(user("1").roles("SUPER_ADMIN")).contentType(MediaType.APPLICATION_JSON)
    .content("{\"categoryName\":\"Renamed category\"}"))
    .andExpect(status().isOk()).andExpect(jsonPath("$.data.categoryName").value("Renamed category"));
  mvc.perform(multipart(path).file(request("{\"categoryName\":\"Renamed\"}"))
    .file(image()).with(req->{req.setMethod("PUT");return req;}).with(user("1").roles("ADMIN")))
    .andExpect(status().isForbidden());
  mvc.perform(delete(path).with(user("1").roles("USER"))).andExpect(status().isForbidden());
  mvc.perform(delete(path).with(user("1").roles("ADMIN"))).andExpect(status().isForbidden());
  mvc.perform(delete(path).with(user("1").roles("SUPER_ADMIN"))).andExpect(status().isOk());
 }
 @Test void superAdminUploadsSingleSliderImageWithoutImageUrlAndDeleteRemovesStorage() throws Exception {
  mvc.perform(multipart("/api/admin/home-sliders").file(request("{\"title\":\"Upload slider\",\"targetUrl\":\"/shop\",\"placementTag\":\"LIMITED_OFFER\"}"))
    .file(image()).with(user("1").roles("SUPER_ADMIN")))
    .andExpect(status().isCreated()).andExpect(jsonPath("$.data.imageUrl").value(org.hamcrest.Matchers.startsWith("https://cdn.example/content/home-slider/")));
  var slider=sliders.findAll().stream().filter(s -> s.getTitle().equals("Upload slider")).findFirst().orElseThrow();
  mvc.perform(delete("/api/admin/home-sliders/"+slider.getHomeSliderId()).with(user("1").roles("SUPER_ADMIN")))
    .andExpect(status().isOk());
  verify(storage).delete(slider.getImageObjectKey());
 }
 @Test void superAdminUploadsAndDeletesBannerImage() throws Exception {
  mvc.perform(multipart("/api/admin/main-banners").file(request("{\"headline\":\"Uploaded banner\"}"))
    .file(image()).with(user("1").roles("SUPER_ADMIN"))).andExpect(status().isCreated());
  var banner=banners.findAll().stream().filter(b -> b.getHeadline().equals("Uploaded banner")).findFirst().orElseThrow();
  mvc.perform(delete("/api/admin/main-banners/"+banner.getMainBannerId()).with(user("1").roles("SUPER_ADMIN"))).andExpect(status().isOk());
  verify(storage).delete(banner.getImageObjectKey());
 }
 @Test void duplicateUploadFilesAreRejected() throws Exception {
  mvc.perform(multipart("/api/categories").file(request("{\"categoryName\":\"Too many images\"}"))
    .file(image()).file(image()).with(user("1").roles("SUPER_ADMIN"))).andExpect(status().isBadRequest());
 }
 private MockMultipartFile request(String json) { return new MockMultipartFile("request","","application/json",json.getBytes(java.nio.charset.StandardCharsets.UTF_8)); }
 private MockMultipartFile image() throws Exception {
  var output=new java.io.ByteArrayOutputStream();
  javax.imageio.ImageIO.write(new java.awt.image.BufferedImage(2,2,java.awt.image.BufferedImage.TYPE_INT_RGB),"png",output);
  return new MockMultipartFile("file","image.png","image/png",output.toByteArray());
 }
}
