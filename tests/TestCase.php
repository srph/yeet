<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Fixes ViteManifestNotFoundException on every test that renders
        // app.blade.php: @vite reads public/build/manifest.json, which is
        // gitignored and never built in CI. No test asserts on asset tags.
        $this->withoutVite();
    }
}
