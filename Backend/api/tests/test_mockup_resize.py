import unittest
from io import BytesIO

from PIL import Image

from app.services.mockup_image_generator import MockupImageGenerator, TARGET_HEIGHT, TARGET_WIDTH


class MockupResizeTests(unittest.TestCase):
    def test_resize_outputs_exact_target_dimensions(self):
        source = Image.new("RGB", (1536, 1024), color=(10, 20, 30))
        buf = BytesIO()
        source.save(buf, format="PNG")
        result = MockupImageGenerator._resize_to_target(buf.getvalue())
        with Image.open(BytesIO(result)) as image:
            self.assertEqual(image.size, (TARGET_WIDTH, TARGET_HEIGHT))

    def test_resize_preserves_aspect_ratio_via_center_crop(self):
        source = Image.new("RGB", (200, 100), color=(255, 0, 0))
        for x in range(20):
            source.putpixel((x, 50), (0, 255, 0))
        buf = BytesIO()
        source.save(buf, format="PNG")
        result = MockupImageGenerator._resize_to_target(buf.getvalue())
        with Image.open(BytesIO(result)) as image:
            left_pixel = image.getpixel((0, image.height // 2))
            self.assertNotEqual(left_pixel, (0, 255, 0))


if __name__ == "__main__":
    unittest.main()
